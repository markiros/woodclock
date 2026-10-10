"""Собирает кадр из слоёв по preset.json — так же, как скринсейвер. Для проверки нарезки."""
import json, sys, math
from pathlib import Path
from PIL import Image
P=Path(sys.argv[1]); S=800
ang={'hour':(10+10/60)*30,'minute':10*6,'second':37*6}
sheet=Image.new('RGBA',(S*2+30,S*2+30),(12,10,9,255))
for i,d in enumerate(sorted(P.iterdir())):
    m=json.loads((d/'preset.json').read_text())
    fr=Image.new('RGBA',(S,S),(0,0,0,255)); c=S/2
    def place(fn,size,anchor,angle=0,off=(0,0)):
        im=Image.open(d/fn).resize((round(size[0]*S),round(size[1]*S)),Image.LANCZOS)
        ax,ay=anchor[0]*im.width,anchor[1]*im.height
        # повернуть вокруг опорной точки: расширяем холст с центром в опоре
        R=int(math.hypot(max(ax,im.width-ax),max(ay,im.height-ay)))+2
        big=Image.new('RGBA',(2*R,2*R)); big.paste(im,(int(R-ax),int(R-ay)))
        big=big.rotate(-angle,resample=Image.BICUBIC)
        fr.alpha_composite(big,(int(c+off[0]*S-R),int(c+off[1]*S-R)))
    for L in m['layers']:
        a=ang.get(L.get('rotates'),0)
        if 'shadow' in L: place(L['shadow']['file'],L['size'],L['anchor'],a,L['shadow']['offset'])
        place(L['file'],L['size'],L['anchor'],a)
    sheet.alpha_composite(fr,((i%2)*(S+30),(i//2)*(S+30)))
sheet.convert('RGB').save(sys.argv[2])
