export const useThemeStore = ()  =>{
  const isDark = useState("isDark", ()=>true)
  const toggleIsDark =()=>{
    console.log(isDark.value);
    isDark.value = !isDark.value  
  }
  return {
    isDark,toggleIsDark
  }
}