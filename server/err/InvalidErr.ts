export default function InvalidError(msg?:string){
    return  createError({
        status: 400,
        message: "Invalid request format." + msg,
        stack: ""
      }).toJSON();
}