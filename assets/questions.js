/* Întrebările pentru vot (aceleași pe ecran și pe telefon).
   type: "choice" – o variantă; "scale" – 1..5; "word" – un cuvânt/expresie scurtă. */
window.QUESTIONS = {
  s1_start: {s:1, type:"choice", text:"De unde ați porni, de obicei, când scrieți o temă din manual?",
    opts:["De la tema din programă (conținutul)","De la rezultatul învățării","De la exercițiile din manualele anterioare","De la un experiment sau o situație reală"]},
  s1_d1: {s:1, type:"choice", text:"Clasa a VI-a: „Eroarea absolută instrumentală – de exclus, prea multe calcule pentru vârstă.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d2: {s:1, type:"choice", text:"Clasa a VI-a: „De introdus eroarea relativă în clasa a VI-a (prin transfer de la clasa a X-a).” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d3: {s:1, type:"choice", text:"Clasa a VI-a: „Precizarea multiplilor și submultiplilor utilizați și tabele de sprijin pentru transformări.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d4: {s:1, type:"choice", text:"Clasa a VI-a: „Studierea modulului «Planul de coordonate» la Matematică în semestrul I, sincron cu graficele mișcării.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d5: {s:1, type:"choice", text:"Clasa a X-a, profil real: „Excluderea mișcării pe traiectorie parabolică – aparat matematic complex.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d6: {s:1, type:"choice", text:"Clasa a X-a, profilurile umanist, general, arte, sport: „O variantă alternativă de măsurare acolo unde se folosește GPS tracking.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d7: {s:1, type:"choice", text:"Clasa a X-a, profilurile umanist, general, arte, sport: „Operațiile cu vectori sunt dificile – de acordat mai mult timp.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_exit: {s:1, type:"word", text:"Un cuvânt: ce schimbă noul curriculum pentru un manual de fizică?"},
  s2_start: {s:2, type:"choice", text:"Ce verificați primul când evaluați o temă din manual?",
    opts:["Corectitudinea științifică","Legătura cu rezultatul învățării","Calitatea exercițiilor","Ilustrațiile și aspectul"]},
  s2_exit: {s:2, type:"scale", text:"Cât de pregătit vă simțiți să construiți o temă din manual pornind de la un rezultat al învățării? (1 – deloc, 5 – complet)", opts:["1","2","3","4","5"]},
  s2_cer: {s:2, type:"choice", text:"Care cerință vi se pare cea mai greu de respectat într-un manual de fizică?", opts:["Lizibilitatea la tipar (300/600 ppi, text ≥ 9 pt, contrast)","Evaluare formativă cu autoevaluare în fiecare unitate","Diferențiere prin sarcini pe niveluri","Volumul corelat cu orele din curriculum","Noile educații fără mesaje moralizatoare"]},
  s2_prop: {s:2, type:"word", list:true, max:60, text:"Propunerea grupei pentru noul caiet de sarcini (pe scurt, cel mult 60 de caractere)"},
  s3_start: {s:3, type:"choice", text:"Ce lipsește cel mai des în manualele de fizică pe care le cunoașteți?",
    opts:["Investigații adevărate (nu doar protocol)","Contexte din viața elevului/elevei","Legături cu alte discipline","Sarcini pe niveluri de dificultate"]},
  s3_it1: {s:3, type:"choice", text:"Clasa a VI-a: graficul d(t) construit cu planul de coordonate și proporționalitatea de la Matematică. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_it2: {s:3, type:"choice", text:"Clasa a VI-a: timpul de reacție, distanța de oprire și reguli de comportament la traversarea străzii. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_it3: {s:3, type:"choice", text:"Clasa a X-a, profil real: mișcarea aparentă a Soarelui raportată la sisteme de referință terestre, ca la Geografie. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_it4: {s:3, type:"choice", text:"Clasa a X-a, profil real: pierderile de energie prin frecare și folosirea mai eficientă a energiei. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_it5: {s:3, type:"choice", text:"Clasa a X-a, profilurile umanist, general, arte, sport: viteza și accelerația sprinterului, cu date de la Educația fizică. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_it6: {s:3, type:"choice", text:"Clasa a X-a, profilurile umanist, general, arte, sport: tema „Fenomenele mecanice în viața omului: de la siguranța personală la responsabilitatea față de comunitate și mediu”. Ce este?", opts:["Interdisciplinaritate","Transdisciplinaritate"]},
  s3_eval: {s:3, type:"scale", text:"Cât de utilă a fost pentru dumneavoastră ziua de formare? (1 – deloc, 5 – foarte)", opts:["1","2","3","4","5"]},
  s3_word: {s:3, type:"word", text:"Un cuvânt: ce idee luați cu dumneavoastră din această zi?"}
};
