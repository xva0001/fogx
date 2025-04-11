import { deleteAccountHandler } from "./deleteAccountHandler";
import { loginEvent } from "./LoginHandler";
import { StoryInsertionHandler } from "./StoryInsertionHandler";
import { updatePasswordEvent } from "./UpdatePasswordHandler";


export const eventDispatcher = {

    "login" : loginEvent,
    "user Password Change" : updatePasswordEvent,
    "delete Account" : deleteAccountHandler,
    "insert story" : StoryInsertionHandler

}