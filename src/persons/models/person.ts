import {BehaviorSubject} from "rxjs";
import {ContextedDomainer} from "../../contexted_domainer"
import {ID} from "../../util"

export class Person extends ContextedDomainer {

  // ---- Properties
  displayName$: BehaviorSubject<string | null>;
  imageUrl$: BehaviorSubject<string | null>;


  // ---- Lifecycle
  constructor(readonly id: ID, displayName: string | null,  imageUrl: string | null) {
    super();
    console.log("++++ Person constructor")

    // ---- Initialize
    this.displayName$ = new BehaviorSubject<string | null>(displayName);
    this.imageUrl$ = new BehaviorSubject<string | null>(imageUrl);
  }
}

