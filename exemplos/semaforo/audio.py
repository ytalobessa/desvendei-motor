import sys; sys.path.insert(0, 'motor')
from sfx import *
preparar(101.2)
# trocas de cena
for t in [5.56, 7.6, 10.81, 14.6, 18.22, 23.85, 27.62, 33.72, 40.4, 46.4, 48.44, 64.31, 69.41, 74.1, 79.6, 89.53, 93.96]: add(t - .08, whoosh(.5), .45)
# rótulos, X, OK, badges
for t in [17.12, 32.1, 46.47, 62.74, 78.17, 88.57]: add(t, ding(), .5)
for t in [9.15, 23.0, 39.9, 51.3, 68.0, 82.3]: add(t, buzz(), .4)
for t in [28.7, 45.0, 77.6, 91.2]: add(t, chime(), .42)
for t in [28.8, 55.4, 56.65, 57.74]: add(t, pop(1000), .32)
# semáforo surge e acende
add(12.85, thud(80, .3), .55); add(12.9, pop(700), .35); add(13.96, electric(.4), .3); add(13.96, pop(1300, .08), .3)
add(25.29, pop(1100), .4); add(25.0, creak(.5), .2)
for t in [19.27, 23.85, 26.49, 29.6, 33.72, 34.75, 41.69, 45.69, 55.4, 56.65, 57.74, 77.6, 85.8, 87.0, 91.4, 96.5]: add(t, pop(1500, .06), .22)
# guarda: briga e saída
for k in range(6): add(6.9 + k * .34, step(), .45)
add(7.2, engine(2.0, 85, 95, 1., True), .45); add(7.3, engine(1.9, 70, 80, 1., True), .4, -.2)
add(8.85, skid(.3), .4); add(9.1, crash(1.2), .6); add(9.1, thud(55, .4), .8); add(9.15, clank(), .5)
# carros
add(0.8, engine(3.4, 80, 90, .9, True), .4, .2); add(3.2, engine(3.4, 85, 95, .9, True), .4, -.2)
add(14.4, engine(3.0, 95, 100, 1., True), .45)
add(20.0, engine(2.4, 45, 70, .7), .3, -.2)
add(19.0, engine(2.6, 110, 115, 1.), .5); add(21.5, skid(2.6), .55); add(22.9, buzz(), .15)
add(24.7, engine(2.0, 75, 60, .8), .35); add(26.5, skid(.6), .12)
add(36.0, engine(9.0, 45, 48, .9), .4)
add(37.0, engine(2.8, 100, 105, 1.), .45, -.2); add(39.7, skid(.6), .5); add(40.25, thud(60, .2), .3)
add(45.9, engine(2.5, 55, 80, .8), .35, -.2)
# grupo focal: pulso de cada luz
for t in [55.4, 56.65, 57.74]: add(t, hum(.5, 220, 220), .2)
# madrugada: carro esperando sozinho
add(64.4, engine(4.8, 38, 38, .5), .18)
# laço indutivo: corte e fio
add(69.9, scrape(.9), .5); add(69.9, rumble(.9), .2)
add(70.83, creak(1.5), .2); add(70.9, hum(1.4, 300, 420), .15)
add(73.8, engine(3.6, 80, 40, .8), .4); add(75.1, skid(.25), .12)
for k in range(3): add(76.3 + k * .35, electric(.3), .25)
add(77.9, engine(2.3, 45, 80, .8), .4)
# pedestre
add(79.6, engine(2.6, 100, 105, 1., True), .4); add(81.4, engine(2.6, 100, 105, 1., True), .4)
add(84.63, pop(800), .4); add(85.4, pop(1800, .05), .5); add(85.42, clank(), .15)
add(84.9, engine(1.6, 80, 50, .8), .35); add(86.09, pop(900), .35); add(87.4, ding(), .25)
for k in range(11): add(87.65 + k * .35, step(), .45)
add(91.5, engine(2.0, 50, 85, .8), .35)
add(92.0, engine(4.0, 85, 90, .8), .3); add(97.0, engine(4.0, 80, 90, .8), .25)
# final
arpejo_final(93.96)
mixar()
