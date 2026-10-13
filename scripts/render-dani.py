"""Reproducible original voxel birthday short. Requires Pillow and imageio-ffmpeg.
No external art, game assets, AI service, or licensed music is used.
Run: python scripts/render-dani.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, random, subprocess, wave, struct, tempfile
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/projects/dani'
OUT.mkdir(parents=True, exist_ok=True)
W,H,FPS,DURATION = 1280,720,30,14
S=1.25
FONT_DIR=Path('C:/Windows/Fonts')
def font(size):
    for path in [FONT_DIR/'segoeuib.ttf',Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]:
        if path.exists(): return ImageFont.truetype(str(path),round(size*S))
    return ImageFont.load_default()
FONTS={size:font(size) for size in [17,19,22,26,32,50,66]}
def rgb(c): return tuple(bytes.fromhex(c.lstrip('#')))
def shade(c,k): return tuple(min(255,round(v*k)) for v in rgb(c))
def clamp(v): return min(1,max(0,v))
R=random.Random(41)
CONFETTI=[(R.random(),R.random(),R.uniform(.4,1.2),R.randrange(5)) for _ in range(82)]
COLORS=['#f2bf54','#ef8998','#68afa9','#779fdb','#b8a3d3']

def frame(t):
    im=Image.new('RGB',(round(W*S),round(H*S)))
    dr=ImageDraw.Draw(im)
    def poly(points,fill): dr.polygon([(round(x*S),round(y*S)) for x,y in points],fill=fill)
    def rect(b,fill): dr.rectangle(tuple(round(v*S) for v in b),fill=fill)
    def line(points,fill,width=2): dr.line([(round(x*S),round(y*S)) for x,y in points],fill=fill,width=round(width*S))
    def text(txt,y,size,color='#153e50',x=640):
        dr.text((round(x*S),round(y*S)),txt,font=FONTS[size],fill=color,anchor='mt',stroke_width=0)
    for y in range(round(H*S)):
        p=y/(H*S); dr.line([(0,y),(W*S,y)],fill=(round(220+19*p),round(243-2*p),round(242-17*p)))
    # Block-shaped clouds, distant floating islands and the morning sun.
    dr.ellipse((1030*S,55*S,1124*S,149*S),fill='#ffdf95')
    for x,y in [(105,150),(1000,216),(260,267)]:
        x+=math.sin(t*.22+x)*9
        for a,b,c,e in [(0,15,150,42),(25,0,75,42),(67,-12,112,42)]:rect((x+a,y+b,x+c,y+e),'#f7fcf7')
    poly([(0,532),(145,393),(273,507),(420,351),(583,553)],'#b2d5cc')
    poly([(738,557),(924,366),(1067,462),(1280,332),(1280,720)],'#b9d8d2')
    # Orthographic camera and depth-sorted cuboid faces.
    yaw=.34+math.sin(t*.30)*.025; co,si=math.cos(yaw),math.sin(yaw)
    scale=87; origin=(640,539)
    def project(p):
        x,y,z=p; depth=si*x+co*z
        return origin[0]+scale*(co*x-si*z),origin[1]+scale*(depth*.40-y*.92)
    faces=[]
    smiles=[]
    def box(x,y,z,dx,dy,dz,c,rz=0,pivot=None):
        vs=[(x+sx*dx/2,y+sy*dy/2,z+sz*dz/2) for sx,sy,sz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        if rz:
            px,py=pivot or (x,y)
            vs=[(px+(a-px)*math.cos(rz)-(b-py)*math.sin(rz),py+(a-px)*math.sin(rz)+(b-py)*math.cos(rz),zz) for a,b,zz in vs]
        for ids,k in [([4,5,6,7],1),([1,2,6,5],.77),([3,7,6,2],1.14)]:
            pts=[vs[i] for i in ids]
            depth=sum(si*a+co*c+b*.45 for a,b,c in pts)/4
            faces.append((depth,[project(v) for v in pts],shade(c,k)))
    # Hand-built floating grass plinth.
    box(0,-.45,0,9.7,.75,5.0,'#b78d68');box(0,-.03,0,9.85,.15,5.12,'#83af87')
    for x in [-4,-2,0,2,4]:
        for z in [-1.9,0,1.9]: box(x,.06,z,1.8,.035,1.7,'#91b995' if (x+z)%3 else '#9ac09a')
    # The supporting plinth is a separate background layer: its large top
    # polygons must not occlude feet when sorting smaller foreground cubes.
    for _,pts,col in sorted(faces,key=lambda f:f[0]):poly(pts,col)
    faces.clear()
    # Streamer columns, festive voxel balloons and gift towers.
    for x in [-4.2,4.2]:
        box(x,1.32,-1.45,.10,2.7,.1,'#b98e63')
        for j in range(2):
            yy=2.7+j*.4+math.sin(t*1.8+j+x)*.08; xx=x+(.22 if j else -.18)
            box(xx,yy,-1.45,.48,.57,.45,COLORS[(j+int(abs(x)))%5])
            box(xx,yy-.4,-1.45,.025,.35,.025,'#e6ddc5')
    for j in range(11):
        x=-3.6+j*.72;y=2.67-.35*(1-(x/3.6)**2)
        box(x,y,-1.5,.55,.27,.045,COLORS[j%5])
    for x,z,c in [(-3.4,.55,'#e99794'),(-3.85,.95,'#86a9d6'),(3.35,.55,'#b5a3d3'),(3.9,.7,'#efbe61')]:
        box(x,.32,z,.62,.62,.62,c);box(x,.64,z,.67,.12,.67,c)
        box(x,.36,z+.32,.10,.71,.014,'#fff0c5');box(x,.71,z,.11,.03,.68,'#fff0c5')
        box(x-.12,.78,z,.22,.14,.12,'#fff0c5');box(x+.12,.78,z,.22,.14,.12,'#fff0c5')
    def person(x,z,shirt,hair,phase,is_dani=False):
        bounce=max(0,math.sin(t*3+phase))*.065
        if 9<t<11:bounce+=abs(math.sin((t-9)*math.pi*2))*.18
        y=bounce
        for side in [-1,1]:
            box(x+side*.20,y+.23,z,.33,.46,.35,'#344f72');box(x+side*.2,y+.065,z+.10,.37,.15,.55,'#f4ecd7')
        box(x,y+.89,z,.83,.87,.43,shirt)
        box(x,y+.95,z+.225,.10,.73,.024,'#f3dda8')
        box(x,y+1.68,z,.87,.82,.75,'#dba277')
        box(x,y+2.10,z-.045,.94,.22,.83,hair)
        box(x-.37,y+1.91,z-.06,.17,.28,.76,hair)
        box(x+.29,y+1.94,z+.35,.29,.23,.09,hair)
        for side in [-1,1]:
            box(x+side*.19,y+1.75,z+.381,.17,.16,.035,'#fff6e4')
            box(x+side*.17,y+1.74,z+.408,.075,.11,.025,'#283d48')
            box(x+side*.19,y+1.91,z+.395,.20,.055,.03,hair)
        box(x,y+1.49,z+.395,.28,.06,.025,'#884f43');box(x,y+1.53,z+.417,.18,.04,.025,'#fff7e5')
        smiles.append([(x-.13,y+1.54,z+.432),(x-.08,y+1.48,z+.432),(x+.08,y+1.48,z+.432),(x+.13,y+1.54,z+.432)])
        for side in [-1,1]:
            angle=side*(.15+.07*math.sin(t*3+phase))
            if side==1: angle=.95+.40*math.sin(t*2.8+phase)
            pivot=(x+side*.53,y+1.26)
            box(x+side*.53,y+.96,z,.25,.62,.30,shirt,angle,pivot)
            box(x+side*.53,y+.59,z,.26,.22,.31,'#dba277',angle,pivot)
        if is_dani:
            box(x,y+2.29,z,.50,.22,.45,'#edbd56');box(x-.18,y+2.47,z,.12,.17,.43,'#edbd56');box(x+.18,y+2.47,z,.12,.17,.43,'#edbd56')
    person(-2.10,-.10,'#68a8a2','#563d35',1)
    person(.0,-.55,'#6d9dcc','#4d3730',0,True)
    person(2.10,-.10,'#ba98c4','#694d39',2)
    # Cake table, icing layers, berries, candles and animated flame voxels.
    for x in [-.75,.75]:
        for z in [1.15,1.9]:box(x,.34,z,.12,.66,.12,'#bd916c')
    box(0,.72,1.52,2.15,.16,1.24,'#e1b98c')
    box(0,.85,1.52,1.65,.10,1.0,'#f4eddb')
    box(0,1.06,1.52,1.40,.36,.83,'#c08062');box(0,1.25,1.52,1.44,.12,.87,'#fff0d6')
    for x in [-.5,0,.5]:
        box(x,1.35,1.65,.14,.12,.14,'#d67b79');box(x,1.48,1.42,.07,.34,.07,'#91b7d5')
        if t<10.4:
            box(x,1.73+math.sin(t*9+x)*.02,1.42,.09,.16,.09,'#ffd276')
    # Render all cubes in camera depth order.
    for _,pts,col in sorted(faces,key=lambda f:f[0]):poly(pts,col)
    for smile in smiles:line([project(v) for v in smile],'#8d5146',3)
    # Confetti is timed as an original birthday celebration.
    if t>2:
        for x,y,s,c in CONFETTI:
            yy=((y*720+(t-2)*65*s)%790)-50;xx=x*1280+math.sin(t*2+y*8)*14
            if yy>215:rect((xx,yy,xx+5*s,yy+10*s),COLORS[c])
    text('BLUE AND SPACE  /  BIRTHDAY STORIES',30,17,'#54817f')
    text('Selamat ulang tahun,',76,50)
    text('Dani!',133,66,'#3c7398')
    if t<4.5: message='Hari ini, petualangan baru dimulai!'
    elif t<9.5:message='Semoga sehat, bahagia, dan penuh kreativitas.'
    else:message='Bangun mimpi besar. Rayakan harimu!'
    # Clean safe-area caption card with restrained branding footer.
    dr.rounded_rectangle((205*S,625*S,1075*S,682*S),radius=16*S,fill='#fff9e9')
    text(message,639,26)
    text('DUNIA BALOK, HARAPAN BESAR',697,17,'#628586')
    return im.resize((W,H),Image.Resampling.LANCZOS)

def soundtrack(path):
    rate=44100; duration=DURATION
    melody=[(0,659),(.35,784),(.7,880),(1.4,784),(2.1,659),(2.8,523),(3.5,587),(4.2,659),(4.9,784),(5.6,1047),(6.3,988),(7,880),(7.7,784),(8.4,659),(9.1,698),(9.8,784),(10.5,880),(11.2,784),(11.9,659),(12.6,523)]
    data=bytearray()
    for n in range(rate*duration):
        t=n/rate;v=0
        for start,f in melody:
            age=t-start
            if 0<=age<1.4:
                env=min(1,age/.012)*math.exp(-age*4)
                v+=.19*env*(math.sin(2*math.pi*f*age)+.25*math.sin(2*math.pi*f*2*age))
        beat=int(t/.7);age=t-beat*.7
        bass=[130.81,164.81,174.61,196][(beat//4)%4]
        v+=.09*math.exp(-age*5)*math.sin(2*math.pi*bass*t)
        v*=min(1,t/.05,(duration-t)/.7)
        sample=round(max(-.9,min(.9,v))*32767);data.extend(struct.pack('<hh',sample,sample))
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(data)

if __name__=='__main__':
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory(prefix='dani-render-') as tmp:
        audio=Path(tmp)/'music.wav';soundtrack(audio)
        command=[ffmpeg,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(audio),'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(OUT/'video.mp4')]
        p=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
        for i in range(FPS*DURATION):
            pic=frame(i/FPS);p.stdin.write(pic.tobytes())
            if i==FPS*6:pic.save(OUT/'poster.jpg',quality=94)
            if i%90==0:print(f'Rendered {i}/{FPS*DURATION}',flush=True)
        p.stdin.close()
        if p.wait():raise RuntimeError('Video encode failed')
    print(f'Created {OUT / "video.mp4"} ({(OUT/"video.mp4").stat().st_size:,} bytes)')
