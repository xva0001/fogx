
//@test @not use @
// import { spawn } from 'child_process'

// export const transposeData = async (input: any[][]) => {
//   const goProcess = spawn('server/externalHandling/transpose')

//   // 写入输入
//   goProcess.stdin.write(JSON.stringify(input))
//   goProcess.stdin.end()

//   // 读取输出
//   return new Promise((resolve, reject) => {
//     let output = ''
//     goProcess.stdout.on('data', (chunk) => output += chunk)
//     goProcess.on('error', reject)
//     goProcess.on('close', (code) => {
//       code === 0 
//         ? resolve(JSON.parse(output)) 
//         : reject(new Error(`Go process failed with code ${code}`))
//     })
//   })
// }