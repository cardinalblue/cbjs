import {User} from "firebase/auth";
import {Subject} from "rxjs"
import {Widget} from "../widget"

export class LoginRequest {
  firebaseUser$ = new Subject<User>()
}
export class LoginWidget extends Widget {
  loginRequest = new LoginRequest()

  close() {
    this.loginRequest.firebaseUser$.complete()
  }
}

