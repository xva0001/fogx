export default function InvalidError(){
    return  createError({
        status: 400,
        message: "Invalid request format.",
        stack: ""
      }).toJSON();
}