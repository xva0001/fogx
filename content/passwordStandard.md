**Password Strength Evaluation Criteria**
We evaluate password strength based on these key factors:

1. **Length**  
   - Minimum: 12 characters  
   - Optimal: 16+ characters  
   - Maximum: 24 characters  
   *Longer passwords get higher scores*

2. **Character Variety**  
   - Lowercase letters (a-z)  
   - Uppercase letters (A-Z)  
   - Numbers (0-9)  
   - Basic symbols (!@#$% etc.)  
   - Extended symbols (accented/special characters)  
   *Using 4+ different types significantly boosts strength*

3. **Security Patterns**  
   - **Bonus Points For:**  
     - Random character distribution  
     - Uncommon combinations  
     - Special characters in middle positions  

   - **Penalties For:**  
     - Repeated characters (e.g., "aaaa")  
     - Simple sequences (e.g., "123", "qwe")  
     - Common phrases (e.g., "password", "admin")  
     - Keyboard patterns (e.g., "1qaz2wsx")  

4. **Entropy Measurement**  
   We calculate cryptographic strength using:  

   ```
   Entropy = (Character set size) × log₂(Password length)
   ```

   - Weak: <28 bits  
   - Medium: 28-35 bits  
   - Good: 35-60 bits  
   - Strong: 60+ bits  

5. **Final Scoring**  
   - 40% Length  
   - 30% Character variety  
   - 30% Entropy value  
   - Penalties reduce final score  

**Strength Indicators**  

- 🔴 Weak: Fails basic requirements
- 🟠 Medium: Meets minimum standards  
- 🔵 Good: Secure for most uses  
- 🟢 Strong: Maximum security  

---

**User Tips for Strong Passwords**  
✅ Mix letters, numbers & symbols  
✅ Use uncommon phrases ("PurpleTiger$Bakes42!")  
✅ Consider length over complexity  
❌ Avoid personal information  
❌ Never reuse passwords  

---

You can display this as:  

- A collapsible "How we measure password strength" section
- Tooltips next to the password meter  
- Step-by-step hints during password creation  
- Visual indicators with hover explanations  
