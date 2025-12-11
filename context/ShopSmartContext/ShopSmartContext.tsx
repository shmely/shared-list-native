import {
  ShoppingList,
  Notification,
  ListItem,
  GroupId,
  User,
  Group,
} from "../../model/types";
import {
  createContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import { FirebaseProductCacheService } from "../../services/firebaseProductCacheService";
import {
  getDocumentSnapshot,
  getListRef,
  updateListItems,
  createNewList as createNewListInFirebase,
  removeListMember as removeListMemberFromFirebase,
  deleteList as deleteListFromFirebase,
  updateListCustomGroupOrder as updateListCustomGroupOrderInFirebase,
} from "../../data-layer/firebase-layer";
import {
  DEFAULT_GROUPS,
  STORAGE_KEYS,
} from "../../configuration/constants";
import { ShopSmartContextType } from "./ShopSmartContext-types";

export const ShopSmartContext = createContext<
  ShopSmartContextType | undefined
>(undefined);
interface ShopSmartProviderProps {
  children: ReactNode;
}

export function ShopSmartProvider({
  children,
}: ShopSmartProviderProps) {
  const [notification, setNotification] =
    useState<Notification | null>(null);
  const [lists, setLists] = useState<
    ShoppingList[]
  >([]);
  const [activeListId, setActiveListId] =
    useState<string | null>(null);

  useEffect(() => {
    FirebaseProductCacheService.setActiveList(
      activeListId
    );
  }, [activeListId]);

  const activeList = useMemo(() => {
    if (!activeListId) {
      return null;
    }
    return (
      lists.find(
        (list) => list.id === activeListId
      ) || null
    );
  }, [lists, activeListId]);

  const sortedGroups = useMemo(() => {
    const customOrder =
      activeList?.customGroupOrder;

    const groupsToSort: Group[] = JSON.parse(
      JSON.stringify(DEFAULT_GROUPS)
    );
    if (customOrder) {
      groupsToSort.sort((a, b) => {
        const orderA = customOrder[a.id] ?? 99;
        const orderB = customOrder[b.id] ?? 99;
        return orderA - orderB;
      });
    }
    return groupsToSort;
  }, [activeList?.customGroupOrder]);

  const createNewList = async (
    name: string,
    activeUser: User
  ) => {
    if (!activeUser)
      throw new Error("User not authenticated");
    await createNewListInFirebase(
      name,
      activeUser
    );
  };

  const updateActiveList = (
    id: string | null
  ) => {
    setActiveListId(id);
    // localStorage.setItem(
    //   STORAGE_KEYS.ACTIVE_LIST_ID,
    //   id
    // );
  };

  const updateCustomGroupOrder =
    async (newOrderMap: {
      [key in GroupId]?: number;
    }) => {
      if (!activeListId) {
        console.error(
          "Cannot update order, no active list ID."
        );
        return;
      }

      // --- Task 1: Optimistically update the local state ---
      // Update the UI immediately for a snappy user experience.
      setLists((currentLists) =>
        currentLists.map((list) =>
          list.id === activeListId
            ? {
                ...list,
                customGroupOrder: newOrderMap,
              } // Create a new list object with the new order
            : list
        )
      );

      // --- Task 2: Try to save the change to Firebase ---
      try {
        await updateListCustomGroupOrderInFirebase(
          activeListId,
          newOrderMap
        );
        console.log(
          "Successfully saved custom group order to Firebase."
        );
      } catch (error) {
        console.error(
          "Failed to save custom group order to Firebase:",
          error
        );
        // OPTIONAL: Here you could add logic to revert the optimistic UI update
        // and show a notification to the user that the save failed.
        setNotification({
          id: Date.now().toString(),
          message:
            "Error: Could not save your sorting preference.",
          listName: activeList
            ? activeList.name
            : "Shopping List",
          timestamp: Date.now(),
        });
      }
    };

  const removeListMember = async (
    listId: string,
    memberUid: string
  ) => {
    await removeListMemberFromFirebase(
      listId,
      memberUid
    );
  };

  const deleteItem = async (
    listId: string,
    itemId: string
  ) => {
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );
    if (listSnap.exists()) {
      const remainingItems = listSnap
        .data()
        .items.filter(
          (item: ListItem) => item.id !== itemId
        );
      await updateListItems(
        listRef,
        remainingItems
      );
    }
  };

  const deleteList = async (listId: string) => {
    await deleteListFromFirebase(listId);
  };

  const addItemToList = async (
    listId: string,
    item: ListItem
  ) => {
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );

    if (listSnap.exists()) {
      // --- Task 1: Add the item to the list's 'items' array ---
      const currentItems =
        listSnap.data().items || [];
      await updateListItems(listRef, [
        ...currentItems,
        item,
      ]);

      // --- Task 2: Add the product to this list's productCache (This is now the main place) ---
      try {
        // This call saves the product's name and category to the cache for future use.
        await FirebaseProductCacheService.addProduct(
          item.name,
          item.groupId
        );
        console.log(
          `Product "${item.name}" added to cache for list ${listId}.`
        );
      } catch (error) {
        console.error(
          "Failed to update product cache:",
          error
        );
      }
    }
  };

  const deleteAllDoneItems = async (
    listId: string
  ) => {
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );
    if (listSnap.exists()) {
      const remainingItems = listSnap
        .data()
        .items.filter(
          (item: ListItem) => !item.isChecked
        );
      await updateListItems(
        listRef,
        remainingItems
      );
    }
  };

  const toggleItem = async (
    listId: string,
    itemToUpdate: ListItem
  ) => {
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );
    if (listSnap.exists()) {
      const newItems = listSnap
        .data()
        .items.map((item: ListItem) =>
          item.id === itemToUpdate.id
            ? {
                ...item,
                isChecked: !item.isChecked,
              }
            : item
        );
      await updateListItems(listRef, newItems);
    }
  };

  const updateItemCategory = async (
    listId: string,
    itemToUpdate: ListItem,
    newGroupId: GroupId
  ) => {
    // --- Task 1: Update the item's category within the specific list ---
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );

    if (listSnap.exists()) {
      const listData =
        listSnap.data() as ShoppingList;
      const newItems = listData.items.map(
        (item) =>
          item.id === itemToUpdate.id
            ? { ...item, groupId: newGroupId }
            : item
      );
      await updateListItems(listRef, newItems);
    }
    //--- Task 2: Update the global product cache ---
    try {
      const cachedItem =
        FirebaseProductCacheService.searchSimilar(
          itemToUpdate.name
        );
      if (
        cachedItem &&
        cachedItem.groupId !== newGroupId
      ) {
        await FirebaseProductCacheService.updateProductCategory(
          cachedItem.id,
          newGroupId
        );
      }
    } catch (error) {
      console.error(
        "Failed to update product cache:",
        error
      );
    }
  };

  const updateItemQuantity = async (
    listId: string,
    itemToUpdate: ListItem,
    newQuantity: number
  ) => {
    const listRef = getListRef(listId);
    const listSnap = await getDocumentSnapshot(
      listRef
    );
    if (listSnap.exists()) {
      const newItems = listSnap
        .data()
        .items.map((item: ListItem) =>
          item.id === itemToUpdate.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      await updateListItems(listRef, newItems);
    }
  };

  return (
    <ShopSmartContext.Provider
      value={{
        notification,
        setNotification,
        lists,
        setLists,
        activeListId,
        updateActiveList,
        activeList,
        sortedGroups,
        createNewList,
        removeListMember,
        deleteAllDoneItems,
        updateCustomGroupOrder,
        updateItemCategory,
        toggleItem,
        addItemToList,
        deleteList,
        deleteItem,
        updateItemQuantity,
      }}
    >
      {children}
    </ShopSmartContext.Provider>
  );
}
