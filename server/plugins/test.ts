import secrets from 'secrets.js-grempe';

export default defineNitroPlugin((nitroApp) => {
    console.log('Nitro plugin test')   
    var pw = "你好，世界!@#$%^&*()+_(*79--=！" // => "Hello, World!"
 
    // convert the text into a hex string
    var pwHex = secrets.str2hex(pw) // => hex string
     
    // split into 5 shares, with a threshold of 3
    var shares = secrets.share(pwHex, 5, 3)

    console.log(shares);
    
     
    // combine 2 shares:
    var comb = secrets.combine(shares.slice(1, 3))
     
    //convert back to UTF string:
    comb = secrets.hex2str(comb)
    console.log(comb === pw) // => false
     
    // combine 3 shares:
    comb = secrets.combine([shares[1], shares[3], shares[4]])
     
    //convert back to UTF string:
    comb = secrets.hex2str(comb)
    console.log(comb === pw) // => true
    
  })
  