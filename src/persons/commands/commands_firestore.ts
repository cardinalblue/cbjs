import {doc, serverTimestamp, setDoc} from "firebase/firestore";
import {mergeMap} from "rxjs/operators";
import {Person} from "../models/person";
import {firestorePersons, PersonMapper} from "..";
import {Command} from "../../command"
import {promise$} from "../../util_rx"

export function commandCreatePerson(personId: string,
                                    name: string|null,
                                    imageUrl: string|null)
  : Command<Person>
{
  return new Command('commandCreatePerson', () => {
    const d = doc(firestorePersons(), personId)
    const data = {
      created_on: serverTimestamp(),
      name,
      image_url: imageUrl,
    }
    return promise$(() =>
      setDoc(d, data)
    ).pipe(
      mergeMap(_ => PersonMapper(personId))
    )
  })
}
