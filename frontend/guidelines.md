la mia webapp deve essere frontend only, mobile-first e connettersi a un db firestore. 

è un'app per un' insegnatnte di Hoop (cerchio, tipo danza acrobatica) e deve aiutare:
1. gli utenti a prenotare le lezioni (ogni utente può prenotare la lazione che vuole ma max 7gg da ora, non tipo la lezione tra 2 settimane)
2. l' insegnante a gestire principalmente 2 cose:
   - vedere le prenotazioni
   - vedere i pagamenti (NON ci serve integrazione effettiva, ci basta qualche campo a db per tracciare i pagamenti, poi vediamo come dopo)

Login/Auth:
Gestita con firebase, per ora mettiamo login con google e login con mail semplice


Funzionalità utente:

L'utente principalmente deve vedere 2 cose: le sue lezioni prenotate e il calendario per prenotarne altre (di base calendario della settimana va bene, ma ovviamente se è venerdì devo poter agilmente prenotare per martedì prossimo) L' utente vede anche le altre persone prenotate per le varie lezioni, non ci sono gravi problemi di security su quello tranquillo (parliamo di un app a uso familaire)


Funzionalità admin:
L'admin deve poter creare 