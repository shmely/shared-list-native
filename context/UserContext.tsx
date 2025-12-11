import { Language, ShoppingList, User } from '../model/types';
import { createContext, useState, useEffect, ReactNode, useMemo, useContext } from 'react';
import { ShopSmartContext } from './ShopSmartContext/ShopSmartContext';
import { auth } from '../firebase';
import { TRANSLATIONS, STORAGE_KEYS } from '../configuration/constants';
import {
  getListRef,
  getListsCollectionRef,
  getUserData,
  listenToAuthChanges,
  listenToUserListsChanges,
  manageListMembershipByEmail,
  queryUserMemberLists,
  removeEmailFromPendingInvites,
  updateUserData,
} from '../data-layer/firebase-layer'

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthLoading: boolean;
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  t: any;
  addListMemberByEmail: (email: string) => Promise<{
    subject: string;
    body: string;
  } | null>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const { activeListId, updateActiveList, activeList, setLists } = useContext(ShopSmartContext);
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>(Language.HE);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  useEffect(() => {
    // This listener runs once on load, and again whenever the user logs in or out.
    const unsubscribe = listenToAuthChanges(auth, handleAuthChange);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return; // Don't query if there's no user

    setIsAuthLoading(true);
    const listsRef = getListsCollectionRef();

    // It only fetches lists where the current user's UID is in the 'members' array.
    const userMemberListsQueryResults = queryUserMemberLists(user.uid, listsRef);

    const unsubscribe = listenToUserListsChanges(userMemberListsQueryResults, onUserListChange);

    return () => unsubscribe();
  }, [user]);

  // useEffect(() => {
  //   try {
  //     localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify(lang));
  //   } catch (error) {
  //     console.error('Error saving language to localStorage:', error);
  //   }
  // }, [lang]);

  const onUserListChange = (userLists: ShoppingList[]) => {
    setLists(userLists);
    console.log('userLists:', userLists);
    setIsAuthLoading(false);
  };

  const handleAuthChange = async (firebaseUser: User | null) => {
    setIsAuthLoading(true);
    if (firebaseUser) {
      firebaseUser.email ? firebaseUser.email.toLowerCase() : null;

      setUser(firebaseUser);
      const userRef = await getUserData(firebaseUser.uid);
      // Pass your custom userData object to updateUserData
      await updateUserData(userRef, firebaseUser);

      // --- HANDLE PENDING INVITATION ---
      const pendingListId = sessionStorage.getItem('pendingInvitation');
      const userEmail = firebaseUser.email?.toLowerCase();

      if (pendingListId && userEmail) {
        const listRef = getListRef(pendingListId);

        await removeEmailFromPendingInvites(listRef, userEmail, firebaseUser.uid);

        sessionStorage.removeItem(STORAGE_KEYS.PENDING_INVITATION);
        updateActiveList(pendingListId);
      }
    } else {
      // User is signed out.
      setUser(null);
      setLists([]); // Clear lists on logout
    }
    setIsAuthLoading(false);
  };

  // --- THIS FUNCTION IS NOW MUCH SIMPLER ---
  const addListMemberByEmail = async (
    email: string
  ): Promise<{
    subject: string;
    body: string;
  } | null> => {
    if (!activeListId || !activeList) {
      throw new Error('No active list selected.');
    }

    // The data layer now handles all the complex database logic.
    const invitationWasCreated = await manageListMembershipByEmail(activeListId, activeList, email);

    if (invitationWasCreated) {
      // If an invitation was created, generate the email content for the UI.
      const appUrl = process.env.REACT_APP_BASE_URL || 'https://your-app-domain.web.app';
      const joinLink = `${appUrl}/join?listId=${activeListId}`;

      const subject = `Invitation to join "${activeList.name}" on Shop Smart`;
      const body = joinLink;

      return { subject, body };
    }

    // If the user was added directly, no email is needed.
    return null;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isAuthLoading,
        lang,
        setLang,
        addListMemberByEmail,
        t,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
