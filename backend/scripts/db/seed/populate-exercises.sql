-- CE2 Exercises for DIAMOND-APP
-- Run this with: mysql -u root -p reved_kids < populate-exercises.sql

-- 1. Insert CE2 Math Exercises
INSERT INTO exercises (titre, competence_id, niveau, matiere, contenu, difficulty_level) VALUES
('Addition simple', 'CE2.MA.C.01', 'ce2', 'mathematiques', '{"question": "Combien font 7 + 8 ?", "options": ["13", "14", "15", "16"], "correct_answer": "15", "type": "QCM"}', 2),
('Soustraction', 'CE2.MA.C.02', 'ce2', 'mathematiques', '{"question": "Combien font 12 - 5 ?", "options": ["6", "7", "8", "9"], "correct_answer": "7", "type": "QCM"}', 2),
('Multiplication', 'CE2.MA.C.03', 'ce2', 'mathematiques', '{"question": "Combien font 6 × 3 ?", "options": ["15", "16", "17", "18"], "correct_answer": "18", "type": "QCM"}', 3),
('Géométrie triangle', 'CE2.MA.G.01', 'ce2', 'mathematiques', '{"question": "Combien de côtés a un triangle ?", "options": ["2", "3", "4", "5"], "correct_answer": "3", "type": "QCM"}', 2),
('Géométrie carré', 'CE2.MA.G.02', 'ce2', 'mathematiques', '{"question": "Quelle figure a 4 côtés égaux ?", "options": ["triangle", "cercle", "carré", "rectangle"], "correct_answer": "carré", "type": "QCM"}', 2);

-- 2. Insert CE2 French Exercises  
INSERT INTO exercises (titre, competence_id, niveau, matiere, contenu, difficulty_level) VALUES
('Féminin des noms', 'CE2.FR.V.01', 'ce2', 'francais', '{"question": "Comment écrit-on le féminin de \"chanteur\" ?", "options": ["chanteuse", "chanteure", "chantrice", "chantresse"], "correct_answer": "chanteuse", "type": "QCM"}', 3),
('Pluriel irrégulier', 'CE2.FR.V.02', 'ce2', 'francais', '{"question": "Quel est le pluriel de \"cheval\" ?", "options": ["chevaux", "chevales", "chevals", "chevaus"], "correct_answer": "chevaux", "type": "QCM"}', 4),
('Identifier verbe', 'CE2.FR.G.01', 'ce2', 'francais', '{"question": "Dans \"Le chat mange\", quel est le verbe ?", "options": ["Le", "chat", "mange", "le chat"], "correct_answer": "mange", "type": "QCM"}', 2),
('Conjugaison être', 'CE2.FR.G.02', 'ce2', 'francais', '{"question": "Conjugue: \"Je ... (être) content\"", "options": ["suis", "es", "est", "sommes"], "correct_answer": "suis", "type": "QCM"}', 3);

-- 3. Insert CE2 Science Exercises
INSERT INTO exercises (titre, competence_id, niveau, matiere, contenu, difficulty_level) VALUES
('Animaux ovipares', 'CE2.SC.VI.01', 'ce2', 'sciences', '{"question": "Quel animal pond des œufs ?", "options": ["chien", "chat", "poule", "lapin"], "correct_answer": "poule", "type": "QCM"}', 2),
('Besoins des plantes', 'CE2.SC.VI.02', 'ce2', 'sciences', '{"question": "De quoi les plantes ont-elles besoin pour grandir ?", "options": ["soleil", "télévision", "musique", "ordinateur"], "correct_answer": "soleil", "type": "QCM"}', 2),
('Anatomie araignée', 'CE2.SC.VI.03', 'ce2', 'sciences', '{"question": "Combien de pattes a une araignée ?", "options": ["6", "7", "8", "10"], "correct_answer": "8", "type": "QCM"}', 3);