import { deleteAccountHandler } from "~/server/eventHandle/deleteAccountHandler";
import { eventDispatcher } from "~/server/eventHandle/EventDispatcher";

export default defineEventHandler(eventDispatcher["delete Account"])