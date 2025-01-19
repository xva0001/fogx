import { createClient } from '@supabase/supabase-js'



const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
console.log(supabaseUrl);
console.log(supabaseKey);
if (supabaseUrl==undefined || supabaseKey==undefined) {
    throw Error()
}

export const supabase = createClient(supabaseUrl, supabaseKey);
        

//```[_{{{CITATION{{{_1{Use Supabase with NuxtJS | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/nuxtjs)
