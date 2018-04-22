from bottle import route, run, debug, request, static_file, post, response, app, ServerAdapter, redirect, abort
import threading
from gevent import monkey
import os
import random
import time
import subprocess
import eyed3
import pickle
from improvednodes import Directory, File
from multiprocessing import Lock
import hashlib
from urllib.parse import quote, unquote


monkey.patch_all()

import sys

random_source = open(u'/dev/urandom', 'rb')

session_id = {}

SECRET_COOKIE_KEY = "THISISDUMB"
USER = os.path.expanduser(u"~")
WEBSITE_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'site')
print(WEBSITE_ROOT)
MUSIC_ROOT = os.path.join(USER, u"Desktop/Music")
PASSWORD_FILE = u"./passwords.dat"
PREFERENCES_FILE = u"./preferences.dat"
LOGIN_ROOT = os.path.join(WEBSITE_ROOT, u'login')
PREFERENCES_LOCK = Lock()
LOGIN_TIME = 100000.0



try:
    musicFiles = pickle.load(open(PREFERENCES_FILE, 'rb'))
    newfiles = musicFiles.updateChanges()
    oldfilecount = musicFiles.filecount
    if oldfilecount != musicFiles.resetFileCounts():
        pickle.dump(musicFiles, open(PREFERENCES_FILE, 'wb'))
        print("%d new files added" % (musicFiles.filecount - oldfilecount))
        
except IOError:
    musicFiles = Directory(MUSIC_ROOT)
    pickle.dump(musicFiles, open(PREFERENCES_FILE, 'wb'))

try:
    userpass = pickle.load(open(PASSWORD_FILE, 'rb'))
except IOError:
    #userpass = {'a', hashlib.sha512('a').hexdigest()}
    sys.stderr.write("Cannot find passwords\n")
    sys.stderr.flush()
    sys.exit(0xbadbeef)
    
unlistened_files = musicFiles.getAllFiles()
unlistened_files = filter(lambda x: x.play_count == 0, unlistened_files)
unlistened_files = list(unlistened_files)
random.shuffle(unlistened_files)

def loggedIn(r):
    return r.get_cookie('session_id', secret=SECRET_COOKIE_KEY) and session_id.get(r.get_cookie('session_id', secret=SECRET_COOKIE_KEY)) \
     and session_id.get(r.get_cookie('session_id', secret=SECRET_COOKIE_KEY)) > time.time() - LOGIN_TIME


@route('/<filename>')
def serveNormal(filename):
    if not os.path.samefile(WEBSITE_ROOT, 
        os.path.commonprefix([WEBSITE_ROOT, 
            os.path.normpath(os.path.join(WEBSITE_ROOT, filename))])):
        abort(404)

    if loggedIn(request):
        if filename.endswith('.py') or filename.endswith('.dat'):
            redirect('/index.html')
        else:
            return static_file(filename, root=WEBSITE_ROOT)
    else:
        redirect('/login/index.html', 307)

@route('/login/<filename:path>')
def serveLogin(filename):
    if loggedIn(request):
        redirect('/index.html', 307)
    if not os.path.samefile(LOGIN_ROOT, 
        os.path.commonprefix([LOGIN_ROOT, 
            os.path.normpath(os.path.join(LOGIN_ROOT, filename))])):
        abort(404)
    if loggedIn(request):
        redirect('/index.html', 307)
    resp = static_file(filename, root=LOGIN_ROOT)
    return resp

@route('/')
def serveBase():
    if loggedIn(request):
        redirect('/index.html', 307)
    else:
        redirect('/login/index.html', 307)

@post('/login/login')
def login():
    global session_id
    username = request.forms.get('username').encode('utf-8')
    password = request.forms.get('password').encode('utf-8')
    
    if username and password and userpass.get(username, None) == hashlib.sha512(password).hexdigest():
        secret_string = random_source.read(128)
        session_id[secret_string] = time.time() + 1000.0
        response.set_cookie("session_id", secret_string, path='/', secret=SECRET_COOKIE_KEY)
        return "Good Response"
    else:
        return "Bad Response"

@post('/renewcookie')
def renewCookie():
    if loggedIn(request):
        session_id[request.get_cookie('session_id', secret=SECRET_COOKIE_KEY)] = time.time()
        #print('renewed cookie')

@route('/audio/<filename:path>')
def serve_audio(filename):
    if loggedIn(request):
        filename = unquote(filename)
    
        if not os.path.samefile(MUSIC_ROOT, os.path.commonprefix([MUSIC_ROOT, os.path.normpath(os.path.join(MUSIC_ROOT, filename))])):
            abort(401, "Sorry, access denied")

        if not os.path.exists(os.path.join(MUSIC_ROOT, filename)):
            print(filename + "Does not exist")
            exit(1)
            
        return static_file(filename, root=MUSIC_ROOT)
    else:
        abort(401, "Sorry, access denied")
    
    
@post('/title/<title>')
def getTitleRequestProcess(title):
    if not loggedIn(request):
        abort(401, "Sorry, access denied")

    with PREFERENCES_LOCK:
        if len(unlistened_files) > 0:
            random_file = unlistened_files.pop()
        else:
            random_file = musicFiles.getRandomFile()
            
        path = random_file.path

        with open(PREFERENCES_FILE, 'wb') as f:
            pickle.dump(musicFiles, f)
    
    args=("ffprobe","-show_entries", "format=duration","-i",os.path.join(MUSIC_ROOT, path))
    
    popen = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=open(os.devnull, 'w'))
    popen.wait()
    output = popen.stdout.read()

    path = os.path.relpath(path, MUSIC_ROOT)
    
    output = {'song_url': '/audio/' + quote(path), 'song_title': getTitle(os.path.join(MUSIC_ROOT, path)), 
            'duration': float(output.split(b'\n')[1].split(b'=')[1])}

    print("Random title requested. Output:", output)

    return output

@post('/song/incrementlistencount')
def updatelistencount():
    if loggedIn(request): 
        with PREFERENCES_LOCK:
            song = request.body.read().decode('utf-8')
            
            try:
                song = os.path.join(MUSIC_ROOT, os.path.relpath(song[song.index('/audio'):], "/audio"))
                song = unquote(song)
                song = musicFiles.findFile(song)

                if song is None:
                    print('-' *80)
                    print('cannot find song')
                    print(song)
                    print('-' *80)
                else:
                    song.updatePlayCount(1)
            except ValueError:
                pass
                
            
            with open(PREFERENCES_FILE, 'wb') as f:
                pickle.dump(musicFiles, f)
    else:
        abort(401, 'Sorry, access denied')

@post('/song/vote')
def upvote():
    if loggedIn(request):
        song = request.json['song']
        vote = request.json['vote']

        with PREFERENCES_LOCK:
            song = os.path.join(MUSIC_ROOT, os.path.relpath(song, "/audio"))
            song = unquote(song)
            song = musicFiles.findFile(song)

            if song is None:
                print('sorry')
                return

            if vote == "upvote":
                song.modifyProbability(song.like_increase)
            elif vote == "downvote":
                song.modifyProbability(song.like_decrease)
            
            with open(PREFERENCES_FILE, 'wb') as f:
                pickle.dump(musicFiles, f)



        return "Your preferences have been noted"        
    else:
        abort(401, "Sorry, access denied")


def getTitle(filepath):
    if loggedIn(request):
        audiofile = eyed3.load(filepath)
        title = None

        if audiofile is not None and audiofile.tag is not None:
            title = audiofile.tag.title
        else:
            title = ''

        if title == "" or title == None:
            title = ''.join(os.path.basename(filepath).split('.')[:-1])

        return title
    else:
        return ''


class GeventSSLServer(ServerAdapter):
    """ Untested. Options:

        * See gevent.wsgi.WSGIServer() documentation for more options.
    """

    def run(self, handler):
        from gevent import pywsgi, local
        if not isinstance(threading.local(), local.local):
            msg = "Bottle requires gevent.monkey.patch_all() (before import)"
            raise RuntimeError(msg)
        if self.quiet:
            self.options['log'] = None

        current_dir = os.path.dirname(os.path.abspath(__file__))

        self.options['keyfile'] = os.path.join(current_dir, 'certificates_/server.key')
        self.options['certfile'] = os.path.join(current_dir, 'certificates_/server.crt')
        
        
        address = (self.host, self.port)
        server = pywsgi.WSGIServer(address, handler, **self.options)
        if 'BOTTLE_CHILD' in os.environ:
            import signal
            signal.signal(signal.SIGINT, lambda s, f: server.stop())
        server.serve_forever()

debug(True)
app().catchall = False
run(port=8080, host="0.0.0.0", server=GeventSSLServer)
