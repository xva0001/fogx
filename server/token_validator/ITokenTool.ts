interface ITokenTool{
    generate : (payload :any)=> string 
    verify : (token :string) => number
    verifyWithBool : (token:string)=>boolean
}