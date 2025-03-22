import { EventHandlerRequest, H3Event } from "h3"

export const printJSONHello = async (event : H3Event<EventHandlerRequest> ) =>{
    return {
        key : "Hello World"
    }
}
export const printJSONHello2 = async (event : H3Event<EventHandlerRequest> ) =>{
    return {
        key : "Hello World2"
    }
}
export const printJSONHello3 = async (event : H3Event<EventHandlerRequest> ) =>{
    return {
        key : "Hello World3"
    }
}
