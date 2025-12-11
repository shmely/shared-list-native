import { db } from "../firebase";
import { arrayRemove, arrayUnion, collection, doc, CollectionReference, onSnapshot, Unsubscribe, DocumentData, DocumentReference, DocumentSnapshot, getDoc, Query, query, setDoc, updateDoc, where, writeBatch, Timestamp, addDoc, deleteDoc, getDocs } from "firebase/firestore";
import {
    GroupId,
    ProductCacheItem,
    ShoppingList,
    User,
} from "../model/types";

import { Auth, onAuthStateChanged } from "firebase/auth";

//------Genral Firestore Functions---------------------------------------------
export const getDocumentSnapshot = (docRef: DocumentReference<DocumentData, DocumentData>): Promise<DocumentSnapshot<DocumentData, DocumentData>> => {
    return getDoc(docRef);
};

//------User Functions----------------------------------------------------------
export const getUserData = (userId: string): DocumentReference<DocumentData, DocumentData> => {
    try {
        const userDocRef = doc(db, "users", userId);
        return userDocRef;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw new Error("Failed to fetch user data");
    }
};

export const updateUserData = async (userRef: DocumentReference<DocumentData, DocumentData>, firebaseUser: User): Promise<void> => {
    await setDoc(
        userRef,
        {
            email: firebaseUser.email
                ? firebaseUser.email.toLowerCase()
                : null,
            displayName:
                firebaseUser.displayName,
        },
        { merge: true }
    );
};

export const listenToAuthChanges = (
    auth: Auth,
    // Use the aliased FirebaseUser type here
    onAuthChange: (user: User | null) => void
): Unsubscribe => {
    const unsubscribe = onAuthStateChanged(auth, onAuthChange);
    return unsubscribe;
};

export const listenToUserListsChanges = (
    userQuery: Query<DocumentData, DocumentData>,
    onUpdate: (lists: ShoppingList[]) => void
): Unsubscribe => {
    const unsubscribe = onSnapshot(
        userQuery,
        (querySnapshot) => {
            const userLists: ShoppingList[] = [];
            querySnapshot.forEach((doc) => {
                userLists.push({
                    id: doc.id,
                    ...doc.data(),
                } as ShoppingList);
            });
            // Call the provided callback with the new data
            onUpdate(userLists);
        }
    );
    // Return the cleanup function
    return unsubscribe;
};

export const manageListMembershipByEmail = async (
  listId: string,
  activeList: ShoppingList,
  email: string
): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase().trim();
  const listRef = getListRef(listId);

  // Check if a user with this email already exists
  const userQuery = queryUserByEmail(normalizedEmail);
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    // --- CASE 1: User Exists ---
    const memberUid = userSnapshot.docs[0].id;

    if (activeList.members.includes(memberUid)) {
      throw new Error('This user is already a member of the list.');
    }

    // Add existing user to members and remove any pending invite for them.
    await updateDoc(listRef, {
      members: arrayUnion(memberUid),
      pendingInvites: arrayRemove(normalizedEmail),
    });
    return false; // User was added, no invitation needed.
  } else {
    // --- CASE 2: User Does NOT Exist ---
    if (activeList.pendingInvites?.includes(normalizedEmail)) {
      throw new Error('This user already has a pending invitation.');
    }

    // Add email to pendingInvites.
    await updateDoc(listRef, {
      pendingInvites: arrayUnion(normalizedEmail),
    });
    return true; // Invitation was created.
  }
};

export const removeEmailFromPendingInvites = async (listRef: DocumentReference<DocumentData, DocumentData>, email: string, userId: string): Promise<void> => {
    await updateDoc(listRef, {
        members: arrayUnion(
            userId
        ),
        pendingInvites:
            arrayRemove(email.toLocaleLowerCase()),
    });
};

//------Shopping List Functions-------------------------------------------------
export const createNewList = async (name: string, owner: User) => {
  const newList = {
    name,
    ownerId: owner.uid,
    members: [owner.uid], // Owner is always the first member
    items: [],
  };
  return await addDoc(collection(db, 'shoppingLists'), newList);
};
export const deleteList = async (listId: string) => {
  const listRef = getListRef(listId);
  await deleteDoc(listRef);
};

export const getListRef = (listId: string): DocumentReference<DocumentData, DocumentData> => {
    return doc(db, "shoppingLists", listId);
}

export const getListsCollectionRef = (): CollectionReference<DocumentData, DocumentData> => {
    return collection(db, "shoppingLists");
};

export const updateListItems = async (listRef: DocumentReference<DocumentData, DocumentData>, items: any[]): Promise<void> => {
    return await updateDoc(listRef, { items });
};

export const updateListCustomGroupOrder = async (
  listId: string,
  customGroupOrder: { [key in GroupId]?: number }
) => {
  const listRef = getListRef(listId);
  await updateDoc(listRef, { customGroupOrder });
};


export const queryUserMemberLists = (userId: string, listRef: Query<DocumentData, DocumentData>): Query<DocumentData, DocumentData> => {
    return query(
        listRef,
        where("members", "array-contains", userId)
    );
};

export const queryUserByEmail = (email: string): Query<DocumentData, DocumentData> => {
    return query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase())
    );
}

export const removeListMember = async (listId: string, memberUid: string) => {
  const listRef = getListRef(listId);
  await updateDoc(listRef, {
    members: arrayRemove(memberUid),
  });
};

// --- Product Cache Functions ---------------------------------------------
const getProductCacheCollectionRef = (listId: string) => {
    return collection(db, "shoppingLists", listId, "productCache");
};
export const addProductToCache = async (
    listId: string,
    productId: string,
    itemName: string,
    groupId: GroupId
): Promise<void> => {
    const docRef = doc(getProductCacheCollectionRef(listId), productId);
    await setDoc(docRef, {
        name: itemName,
        groupId: groupId,
        addedAt: Timestamp.now(),
    });
};

export const subscribeToProductCache = (
    listId: string,
    onUpdate: (products: ProductCacheItem[]) => void
): Unsubscribe => {
    const q = query(getProductCacheCollectionRef(listId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const products: ProductCacheItem[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name,
                groupId: data.groupId,
                addedAt: (data.addedAt as Timestamp).toMillis(),
            });
        });
        onUpdate(products);
    });
    return unsubscribe;
};

export const updateProductCacheCategory = async (
    listId: string,
    productId: string,
    newGroupId: GroupId
): Promise<void> => {
    const docRef = doc(getProductCacheCollectionRef(listId), productId);
    await updateDoc(docRef, { groupId: newGroupId });
};