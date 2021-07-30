import {Person} from "../models/person";

export interface Accessible {
  isAccessible?: (currentPerson: Person | null) => boolean;
}