import { supabase } from "./dbconnect"
export async function checkConnection() {
    const { error } = await supabase.from('users').select().limit(1)
    if (error) {
      console.error('Connection failed:', error.message)
      return false
    }
    console.log('Connection successful')
    return true
  }
  
  
  