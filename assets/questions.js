/* Întrebările pentru vot (aceleași pe ecran și pe telefon).
   type: "choice" – o variantă; "scale" – 1..5; "word" – un cuvânt/expresie scurtă. */
window.QUESTIONS = {
  s1_start: {s:1, type:"choice", text:"De unde porniți, de obicei, când scrieți o lecție de manual?",
    opts:["De la tema din programă (conținutul)","De la rezultatul învățării (RÎ)","De la exercițiile din manualele anterioare","De la un experiment sau o situație reală"]},
  s1_d1: {s:1, type:"choice", text:"Clasa a VI-a: „Eroarea absolută instrumentală – de exclus, prea multe calcule pentru vârstă.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d2: {s:1, type:"choice", text:"Clasa a VI-a: „De introdus eroarea relativă în clasa a VI-a (prin transfer de la clasa a X-a).” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d3: {s:1, type:"choice", text:"Clasa a VI-a: „Precizarea multiplilor și submultiplilor utilizați și tabele de sprijin pentru transformări.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d4: {s:1, type:"choice", text:"Clasa a VI-a: „Studierea modulului «Planul de coordonate» la Matematică în semestrul I, sincron cu graficele mișcării.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d5: {s:1, type:"choice", text:"Clasa a X-a, real: „Excluderea mișcării pe traiectorie parabolică – aparat matematic complex.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d6: {s:1, type:"choice", text:"Clasa a X-a, U/G/A/S: „O variantă alternativă de măsurare acolo unde se folosește GPS tracking.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_d7: {s:1, type:"choice", text:"Clasa a X-a, U/G/A/S: „Operațiile cu vectori sunt dificile – de acordat mai mult timp.” Ce au decis autorii?", opts:["Acceptat","Acceptat parțial","Respins"]},
  s1_exit: {s:1, type:"word", text:"Un cuvânt: ce schimbă noul curriculum pentru manualul pe care îl scrieți?"},
  s2_start: {s:2, type:"choice", text:"Ce verificați primul când evaluați o lecție de manual?",
    opts:["Corectitudinea științifică","Legătura cu rezultatul învățării","Calitatea exercițiilor","Ilustrațiile și aspectul"]},
  s2_exit: {s:2, type:"scale", text:"Cât de pregătit vă simțiți să construiți o lecție de manual pornind de la RÎ? (1 – deloc, 5 – complet)", opts:["1","2","3","4","5"]},
  s3_start: {s:3, type:"choice", text:"Ce lipsește cel mai des în manualele de fizică pe care le cunoașteți?",
    opts:["Investigații adevărate (nu doar protocol)","Contexte din viața elevului","Legături cu alte discipline","Sarcini pe niveluri de dificultate"]},
  s3_temaVI: {s:3, type:"choice", text:"Clasa a VI-a: ce temă de proiect ați dezvolta prima în manual?",
    opts:["Drumul spre școală în siguranță","Lumea mărimilor fizice","Pământul, Luna și Soarele","De la Nistru la Prut: viteza râurilor"]},
  s3_temaX: {s:3, type:"choice", text:"Clasa a X-a, real: ce temă de proiect ați dezvolta prima în manual?",
    opts:["Mobilitate urbană durabilă","Video-analiza mișcării în sport","Hidrocentralele de pe Prut și Nistru","Seismele din Vrancea și clădirile"]},
  s3_eval: {s:3, type:"scale", text:"Cât de utilă a fost ziua pentru munca dumneavoastră de autor? (1 – deloc, 5 – foarte)", opts:["1","2","3","4","5"]},
  s3_word: {s:3, type:"word", text:"Ce schimbați primul în manualul dumneavoastră după această zi?"}
};
