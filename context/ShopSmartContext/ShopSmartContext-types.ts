import { GroupId, ListItem, ShoppingList, User, Notification, Group } from "../../model/types";

export type ShopSmartContextType = {
    notification: Notification | null;
    setNotification: React.Dispatch<React.SetStateAction<Notification | null>>;
    lists: ShoppingList[];
    setLists: React.Dispatch<React.SetStateAction<ShoppingList[]>>;
    removeListMember: (listId: string, memberUid: string) => Promise<void>;
    createNewList: (name: string, activeUser: User) => Promise<void>;
    updateItemQuantity: (listId: string, itemToUpdate: ListItem, newQuantity: number) => Promise<void>;
    toggleItem: (listId: string, itemToUpdate: ListItem) => Promise<void>;
    deleteAllDoneItems: (listId: string) => Promise<void>;
    addItemToList: (listId: string, newItem: ListItem) => Promise<void>;
    deleteItem: (listId: string, itemId: string) => Promise<void>;
    activeListId?: string | null;
    updateActiveList: (id: string | null) => void;
    activeList: ShoppingList | null;
    deleteList: (listId: string) => Promise<void>;
    sortedGroups: Group[];
    updateCustomGroupOrder: (customeGroupOrder: {
        [key in GroupId]?: number;
    }) => Promise<void>;
    updateItemCategory: (
        listId: string,
        itemToUpdate: ListItem, // <-- Changed from itemId
        newGroupId: GroupId
    ) => Promise<void>;
};