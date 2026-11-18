import sys; sys.path.insert(0, 'motor')
from sfx import *
preparar(106.8)  # mesma DUR da cena
# ---------- eventos ----------
for t in [5.6, 7.25, 11.45, 16.75, 18.85, 20.65, 25.7, 31.85, 36.1, 40.7, 42.84, 48.0, 54.2, 57.75, 65.5, 78.25, 83.2, 93.25, 94.7]: add(t - .08, whoosh(.5), .5)
for t in [18.9, 40.74, 52.16, 63.04, 75.71, 93.29]: add(t, ding(), .5)
for t in [6.45, 10.75, 21.8, 24.6, 47.6, 56.75, 70.3, 82.2]: add(t, buzz(), .42)
for t in [38.1, 74.4, 98.3]: add(t, chime(), .45)
for t in [1.55, 60.4, 62.1]: add(t, thud(90, .3), .55); add(t + .02, pop(700), .35)
for t in [28.4, 30.2, 36.3, 39.0, 32.9]: add(t, pop(1000), .3)
# carros
add(5.6, engine(3.2, 85, 95, 1., True), .55, .2); add(9.3, engine(2.2, 90, 100, 1., True), .55, .2)
add(16.0, engine(3.2, 95, 105, 1., True), .5); add(18.15, thud(55, .4), .8); add(18.3, thud(50, .4), .7); add(18.35, creak(.8), .35); add(18.5, clank(), .35)
add(22.0, engine(3.9, 45, 45, .8), .4); add(24.28, thud(60, .3), .6); add(24.35, scrape(.95), .45); add(25.12, thud(55, .3), .5)
add(35.7, engine(3.0, 60, 62, .8, True), .45); add(37.94, thud(70, .2), .3); add(38.26, thud(65, .2), .25)
add(38.3, engine(2.6, 110, 115, 1., True), .55); add(39.93, thud(50, .45), .9); add(40.05, thud(45, .45), .8); add(40.1, creak(1.0), .45); add(40.15, clank(), .45)
add(42.8, engine(5.2, 65, 70, .9), .5); add(47.46, thud(50, .45), .9); add(47.7, clank(), .5); add(47.75, creak(.7), .35)
add(54.2, engine(1.6, 80, 82, .9), .5); add(55.7, skid(1.6), .55); add(56.81, thud(50, .45), .9); add(56.85, clank(), .5)
add(94.0, engine(2.6, 70, 40, .8), .45); add(96.1, skid(.35), .15)
add(99.5, engine(5.0, 45, 48, .7), .3); add(102.7, thud(70, .2), .2); add(103.4, thud(65, .2), .18)
# criança
for t in [7.6, 7.95, 8.2, 10.3, 10.8, 11.0]: add(t, step(), .5)
add(79.85, step(), .6)
for k in range(10): add(80.0 + k * .28, step(), .45)
add(82.45, step(), .6)
for k in range(9): add(96.95 + k * .28, step(), .4)
# obra: asfalto sendo despejado
add(12.6, rumble(3.8), .25); add(12.6, gravel(3.8), .35); add(16.25, thud(80, .25), .4)
# esticar
add(26.6, rise(4.0), .45); add(26.6, gravel(3.9), .2)
# pintura
for k in range(9): add(49.2 + k * .27, spray(.24), .45)
for k in range(9): add(91.9 + k * .12, spray(.16), .35)
# chuva e água
add(65.5, rainn(12.8), .5)
add(66.7, pour(2.3), .45); add(68.95, splash(), .5); add(69.0, pour(1.4), .35)
add(72.4, clank(), .25); add(72.5, pour(2.2), .45)
for k in range(5): add(69.2 + k * .3, drip(), .12)
# lombofaixa subindo
add(85.4, rumble(3.4), .3); add(85.4, rise(3.4), .4); add(88.8, thud(70, .3), .4)
# final
arpejo_final(98.93)
add(102.1, pop(800), .35); add(102.1, whoosh(.4), .3)

mixar()
