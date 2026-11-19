/* Regimul de formator: conținutul pentru formatori este criptat (AES-GCM, cheie derivată din parolă cu PBKDF2-SHA256)
   și se decriptează numai în browser, după introducerea parolei. Parola rămâne doar în fila curentă (sessionStorage). */
(function(){
  const K = "fa_pw";
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function decrypt(blob, pw){
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({name: "PBKDF2", salt: b64(blob.s), iterations: blob.n, hash: "SHA-256"},
      base, {name: "AES-GCM", length: 256}, false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({name: "AES-GCM", iv: b64(blob.i)}, key, b64(blob.c));
    return new TextDecoder().decode(pt);
  }
  window.Formator = {
    decrypt,
    saved: () => { try{ return sessionStorage.getItem(K); }catch(e){ return null; } },
    remember: pw => { try{ sessionStorage.setItem(K, pw); }catch(e){} },
    forget: () => { try{ sessionStorage.removeItem(K); }catch(e){} }
  };
})();
