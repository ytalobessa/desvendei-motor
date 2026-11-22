import sys; sys.path.insert(0, 'motor')
from sfx import *
preparar(85.9)
# trocas de cena
for t in [4.87, 9.8, 18.2, 23.31, 35.12, 51.93, 64.3, 74.39, 77.86]: add(t - .08, whoosh(.5), .45)
# rótulos, X, checks, badges
for t in [22.19, 34.49, 51.19, 62.51, 73.22]: add(t, ding(), .5)
for t in [9.07, 26.96, 40.95, 55.55, 66.28]: add(t, buzz(), .4)
for t in [20.9, 32.8, 49.5, 60.92, 72.4]: add(t, chime(), .42)
for t in [6.49, 17.44, 19.3, 20.07, 40.89, 65.72, 72.21]: add(t, pop(1000), .3)
# caixa aparece e enche, cano liga, chuveiro abre
add(1.38, thud(80, .3), .5); add(1.4, pop(700), .3); add(1.5, pour(1.1), .3); add(3.0, clank(), .2)
add(3.6, spray(.35), .35); add(3.75, rainn(1.1), .25)
# pingos
for t in [8.7, 9.4, 10.1, 11.0, 11.9, 12.8, 13.7, 14.6, 15.5, 16.4, 17.3, 18.2]: add(t, drip(), .35)
# torre sobe
for k in range(5): add(10.7 + k * .5, wood(), .45)
add(10.68, creak(2.4), .3); add(10.68, rise(2.6), .25); add(13.3, thud(70, .35), .55)
# água empurrada, régua, chuveiro forte
add(15.95, pour(2.2), .22); add(18.53, rise(1.1), .25)
for i in range(6): add(18.6 + i * .18, pop(900 + i * 140, .06), .22)
add(19.0, rainn(2.2), .45); add(20.07, spray(.4), .4)
# cano fino com curvas, água perde força
add(24.25, whoosh(.4), .3)
for i in range(8): add(25.4 + i * .1, pop(1400, .05), .25)
add(26.6, drip(), .3); add(27.3, drip(), .3)
# cano grosso desce
add(30.4, scrape(1.5), .35); add(32.0, clank(), .4); add(32.3, spray(.45), .45); add(32.4, rainn(1.8), .45)
# caixa esvazia e enche, entra ar
add(36.29, pour(.8), .25); add(37.1, drip(), .3); add(37.6, pour(2.3), .35)
for i in range(5): add(38.5 + i * .25, pop(500 + i * 60, .1), .3)
# chuveiro cospe aos trancos
for t in [40.4, 41.1, 41.85, 42.55, 43.3, 44.0, 44.75, 45.45, 46.2, 46.9]: add(t, spray(.22), .45); add(t, thud(110, .12), .25)
# respiro sobe, ar escapa
add(45.9, scrape(1.4), .3); add(47.4, clank(), .3)
for i in range(7): add(49.5 + i * .18, pop(1600 - i * 50, .07), .3)
add(49.4, spray(.4), .4); add(49.5, rainn(2.2), .4)
# cozinha: torneira abre, chuveiro enfraquece
add(52.4, clank(), .25); add(52.59, spray(.3), .35); add(52.7, pour(3.4), .3)
add(55.5, drip(), .2)
# ramal exclusivo
add(57.47, scrape(1.5), .3); add(59.0, clank(), .4); add(59.05, spray(.4), .45); add(59.1, rainn(2.0), .4)
# vizinho: pingando, bomba, registro, bomba liga
for t in [64.6, 65.5, 66.4, 67.3, 68.2, 69.1, 70.0, 70.9]: add(t, drip(), .3)
add(68.8, thud(90, .3), .45); add(68.85, pop(800), .3)
add(71.68, creak(.5), .3); add(72.21, hum(2.0, 140, 170), .35); add(72.21, electric(.3), .2); add(72.3, spray(.45), .45); add(72.4, rainn(1.8), .4)
# todos fortes
add(74.5, rainn(2.6), .35); add(75.0, pour(2.0), .2)
arpejo_final(77.86)
mixar()
