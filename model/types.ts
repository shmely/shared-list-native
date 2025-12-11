export enum Language {
  HE = 'he',
  EN = 'en'
}

export enum GroupId {
  FRUITS_VEG = 'fruits_veg',
  DAIRY = 'dairy',
  BAKERY = 'bakery',
  FROZEN = 'frozen',
  DRY_GOODS = 'dry_goods',
  CLEANING = 'cleaning',
  OTHER = 'other',
  BUTCHER = "butcher",
  FISHS = "fishes",
  DRINKS = "drinks",
  ALCOHOL = "alcohol",
  TOILETRIES = "toiletries"
}

export interface Group {
  id: GroupId;
  order: number;
  icon: string;
  translationKey: string;
}

export interface ListItem {
  id: string;
  name: string;
  groupId: GroupId;
  isChecked: boolean;
  addedBy: string; 
  timestamp: number;
  quantity: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // Array of User IDs
  items: ListItem[];
  customGroupOrder?: { [key in GroupId]?: number }; // Allow users to override default order
  pendingInvites?: string[]; 
}


export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Notification {
  id: string;
  message: string;
  listName: string;
  timestamp: number;
}

export interface ProductCacheItem {
  id: string;
  name: string;
  groupId: GroupId;
  addedAt: number;
}