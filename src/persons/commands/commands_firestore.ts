import firebase from "firebase/app";
import {mergeMap} from "rxjs/operators";
import {Person} from "../models/person";
import {firestorePersons, PersonMapper} from "..";
import {Command, promise$} from "@piccollage/cbjs";

export function commandCreatePerson(personId: string,
                                    name: string|null,
                                    imageUrl: string|null)
  : Command<Person>
{
  return new Command('commandCreatePerson', () => {
    const data = {
      created_on: firebase.firestore.FieldValue.serverTimestamp(),
      name,
      imageUrl,
    }
    return promise$(() =>
      firestorePersons()
        .doc(personId)
        .set(data)
    ).pipe(mergeMap(_ => PersonMapper(personId)))
  })
}
