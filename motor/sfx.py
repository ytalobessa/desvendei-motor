# Biblioteca de efeitos sonoros sintetizados (sem música). Uso no audio.py do vídeo:
#   from sfx import *; preparar(DUR); add(t, whoosh(), .5); ...; mixar()
import numpy as np, soundfile as sf, subprocess
from scipy.signal import lfilter
SR = 44100; rng = np.random.default_rng(3)
DUR = None; N = None; fx = None
def preparar(dur):
    global DUR, N, fx
    DUR = dur; N = int(SR * dur); fx = np.zeros((N, 2))
def env(n, a=.005, r=.2): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def add(t0, sig, gain=1., pan=0., buf=None):
    buf = fx if buf is None else buf
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[:N - i] * gain; l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    buf[i:i + len(sig), 0] += sig * l * 1.41; buf[i:i + len(sig), 1] += sig * r * 1.41
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, a): return lfilter([a], [1, a - 1], x)
def hp(x, a): return x - lp(x, a)
def tone(f, d, kind='sine'):
    t = np.arange(int(d * SR)) / SR
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape)) / SR if np.ndim(f) else 2 * np.pi * f * t
    return {'sine': np.sin(ph), 'tri': 2 / np.pi * np.arcsin(np.sin(ph)), 'sq': np.tanh(3 * np.sin(ph)), 'saw': ((ph / np.pi) % 2) - 1}[kind]
def whoosh(d=.55):
    n = noise(d); t = np.linspace(0, 1, len(n)); k = np.sin(np.pi * t); x = hp(n, .02)
    return (lp(x, .06) * (1 - k) + lp(x, .3) * k) * np.sin(np.pi * t) ** 2 * .9
def thud(f=70, d=.35): t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * (f * t + 40 * (1 - np.exp(-t * 30)) / 30)) * np.exp(-t * 12) + lp(noise(d), .05) * np.exp(-t * 25) * .6
def pop(f=900, d=.12): t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * t * (1 + .8 * np.exp(-t * 40))) * np.exp(-t * 35)
def ding():
    s = sum(tone(f, .9) * a for f, a in [(1318.5, 1), (1975.5, .5), (2637, .25)]) * env(int(.9 * SR), .002, .25) * .5; p = pop(600, .1); s[:len(p)] += p * .4; return s
def chime():
    s = np.zeros(int(.8 * SR))
    for k, f in enumerate([880, 1318.5]): x = tone(f, .6) * env(int(.6 * SR), .002, .18); i = int(k * .09 * SR); s[i:i + len(x)] += x * .45
    return s
def buzz():
    d = .42; s = tone(155, d, 'sq') * .5 + tone(160, d, 'sq') * .5; e = np.ones(int(d * SR)); e[int(.17 * SR):int(.22 * SR)] = .1
    return lp(s, .25) * e * env(int(d * SR), .005, 1.) * .6
def clank():
    d = .4; t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * 420 * t) + .6 * np.sin(2 * np.pi * 1130 * t) + .4 * np.sin(2 * np.pi * 2210 * t)) * np.exp(-t * 18) * .35 + thud(60, .4) * .8
def rumble(d): n = noise(d); t = np.linspace(0, 1, len(n)); return lp(n, .01) * 6 * np.sin(np.pi * t) ** .5
def gravel(d): n = noise(d); t = np.linspace(0, 1, len(n)); g = (rng.random(len(n)) < .004).astype(float); return (hp(lp(n, .2), .05) * .25 + lp(g, .5) * 3) * np.minimum(1, np.minimum(t * 6, (1 - t) * 6))
def creak(d):
    t = np.arange(int(d * SR)) / SR; f = 90 + 30 * np.sin(2 * np.pi * .7 * t) + 15 * np.sin(2 * np.pi * 3.1 * t)
    return lp(tone(f, d, 'sq') * (.5 + .5 * np.sin(2 * np.pi * 11 * t) ** 2), .06) * np.sin(np.pi * np.linspace(0, 1, len(t))) * .5
def pour(d):
    n = noise(d); t = np.linspace(0, 1, len(n)); bub = lp((rng.random(len(n)) < .0015).astype(float), .2) * 8
    return (lp(n, .03) * 2 + bub) * np.minimum(1, np.minimum(t * 8, (1 - t) * 8)) * .5
def splash(d=.8): n = noise(d); t = np.arange(len(n)) / SR; return (lp(n, .25) * np.exp(-t * 5) + lp(n, .05) * np.exp(-t * 2) * 1.5) * .6
def rainn(d): n = noise(d); t = np.linspace(0, 1, len(n)); return hp(n, .3) * np.minimum(1, np.minimum(t * 4, (1 - t) * 3)) * .35
def rise(d): t = np.linspace(0, 1, int(d * SR)); return tone(300 + 500 * t ** 2, d, 'tri') * np.sin(np.pi * t) * .2 + whoosh(d) * .3
def engine(d, f0=70, f1=70, vol=1., doppler=False):
    t = np.linspace(0, 1, int(d * SR)); f = f0 + (f1 - f0) * t
    if doppler: f = f * (1.12 - 0.24 * (1 / (1 + np.exp(-(t - .5) * 12))))
    x = lp(tone(f, d, 'saw') * .5 + tone(f * 2, d, 'saw') * .25 + lp(noise(d), .05) * .4, .08)
    e = np.sin(np.pi * t) ** 1.2 if doppler else np.minimum(1, np.minimum(t * 6, (1 - t) * 6))
    return x * e * vol
def skid(d):
    t = np.linspace(0, 1, int(d * SR)); f = 1150 - 250 * t + 40 * np.sin(2 * np.pi * 23 * t * d)
    return (tone(f, d, 'tri') * .25 + hp(noise(d), .2) * .25) * np.minimum(1, np.minimum(t * 15, (1 - t) * 4))
def scrape(d):
    t = np.linspace(0, 1, int(d * SR)); n = hp(noise(d), .25); return (n * .5 + tone(2400 + 300 * np.sin(2 * np.pi * 9 * t * d), d, 'sq') * .08) * np.minimum(1, np.minimum(t * 20, (1 - t) * 5))
def spray(d=.22): n = noise(d); t = np.linspace(0, 1, len(n)); return hp(lp(n, .6), .3) * np.sin(np.pi * t) ** .6 * .5
def step():
    a = thud(110, .12) * .4; b = lp(noise(.06), .3) * env(int(.06 * SR), .001, .02) * .3; a[:len(b)] += b; return a
def drip(): t = np.arange(int(.12 * SR)) / SR; return np.sin(2 * np.pi * (900 + 1400 * t / .12) * t) * np.exp(-t * 40)


def brick(): # tijolo/bloco assentando
    a = thud(140, .18) * .6; t = np.arange(len(a)) / SR; a += np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * .25 + lp(noise(len(a) / SR), .4) * np.exp(-t * 50) * .2; return a
def hammer(): t = np.arange(int(.25 * SR)) / SR; return (np.sin(2 * np.pi * 1800 * t) * .4 + np.sin(2 * np.pi * 3100 * t) * .2) * np.exp(-t * 30) + thud(90, .25) * .5
def wood(): t = np.arange(int(.3 * SR)) / SR; return (np.sin(2 * np.pi * 320 * t) + .5 * np.sin(2 * np.pi * 710 * t)) * np.exp(-t * 25) * .5 + lp(noise(.3), .3) * np.exp(-t * 40) * .3
def hum(d, f0=60, f1=60): t = np.linspace(0, 1, int(d * SR)); f = f0 + (f1 - f0) * t; return (tone(f, d, 'tri') * .5 + tone(f * 2, d) * .2) * np.minimum(1, np.minimum(t * 10, (1 - t) * 10)) * .5
def wind(d): n = noise(d); t = np.linspace(0, 1, len(n)); return lp(n, .02) * 3 * (0.6 + 0.4 * np.sin(2 * np.pi * t * 2)) * np.minimum(1, np.minimum(t * 5, (1 - t) * 5))
def electric(d=.5): t = np.arange(int(d * SR)) / SR; return (tone(120, d, 'sq') * .3 + hp(noise(d), .3) * .2 * (np.random.default_rng(1).random(len(t)) > .7)) * np.exp(-t * 4)
def crash(d=1.4): n = noise(d); t = np.arange(len(n)) / SR; return lp(n, .12) * np.exp(-t * 3) * .8
def arpejo_final(t0, gain=.32):
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]): add(t0 + i * .09, tone(f, 1.2, 'tri') * env(int(1.2 * SR), .003, .4), gain)
    for k in range(14): add(t0 + .07 + rng.random() * 1.6, pop(900 + rng.random() * 900, .08), .2)
def mixar(voz='voz.mp3', saida='mix.wav', alvo_fx=-29.0):
    """Normaliza os efeitos para ~-29 dB RMS (voz ~-19 dB) e soma com a voz. Sem música."""
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', voz, '-ar', '44100', '-ac', '2', 'voz_44.wav'], check=True)
    v0, _ = sf.read('voz_44.wav'); v = np.zeros((N, 2)); v[:min(N, len(v0))] = v0[:N]
    r = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12); G = 10 ** ((alvo_fx - r(fx)) / 20)
    m = v + fx * G; pk = np.abs(m).max(); m = m / pk * .95 if pk > .95 else m
    sf.write(saida, m, SR); print('voz', round(r(v), 1), 'dB | efeitos', round(r(fx * G), 1), 'dB')
