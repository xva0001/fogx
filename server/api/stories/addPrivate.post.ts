import { eventDispatcher } from "~/server/eventHandle/EventDispatcher";
import { StoryInsertionHandler } from "~/server/eventHandle/StoryInsertionHandler";

export default defineEventHandler(eventDispatcher["insert story"])