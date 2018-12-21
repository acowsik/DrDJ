import os
import pickle
import pdb
from math import fsum
from itertools import chain
import random
import sys

def safeDivide(a, b, c):
    if c == 0:
        return float('inf')
    try:
        return a / b
    except ZeroDivisionError:
        return float('inf')

class Directory(object):
    acceptable = {u'mp3', u'm4a'}

    def __init__(self, path, parent=None, isRoot=False):
        self.path = path
        self.isRoot = isRoot
        self.pmodifier = 1.0
        self.parent = parent
        self.play_count = 0

        self.mtime = os.path.getmtime(path)

        #self.files = []
        self.contents = []
        self.filecount = 0
        dirs = []

        self.time_modified = os.path.getmtime(self.path)

        
        for item in os.listdir(path):
            try:
                item = os.path.join(path, item)
            except:
                #print(path, item)
                #print(path.__repr__(), item.__repr__())
                raise
            if os.path.isfile(item):
                if item.split('.')[-1] in Directory.acceptable:
                    self.contents.append(File(item, self))
                    self.filecount += 1
            elif os.path.isdir(item):
                dirs.append(item)

        for directory in dirs:
            newDir = Directory(directory, parent=self)
            self.merge(newDir)

    def merge(self, subdir):
        assert os.path.samefile(os.path.commonprefix([subdir.path, self.path]), self.path)
        assert os.path.samefile(os.path.join(self.path, os.path.basename(subdir.path)), subdir.path)

        totalFiles = subdir.filecount + self.filecount

        self.contents.append(subdir)
        self.filecount = totalFiles

    def update(self, filesAdded):
        self.filecount += filesAdded

        if self.parent is not None:
            self.parent.update(filesAdded, self)


    def getAllFiles(self):
        # itertools expects seperate arguments for each 
        # iterator instead of all of them in one iterator
        return chain(*map(lambda x: x.getAllFiles(), self.contents)) 

    def getRandomFile(self, dither=True):
        if dither:
            # instead of doing this kind of "falloff" dither we will just choose from the bottom 10% to always establish a floor
            normalized_contents = self.contents[:]
            normalized_contents.sort(key=lambda x: safeDivide(x.play_count, x.getProbability(), x.filecount))
            files_to_choose_from = len(normalized_contents)//10 + 1
            #return random.choice(normalized_contents[:bottom_10]).getRandomFile(dither=dither)
        else:
            files_to_choose_from = self.contents

        totalProbability = fsum(map(lambda x: x.filecount * x.pmodifier, files_to_choose_from))
        s = random.random() * totalProbability
        for item in self.contents:
            s -= item.pmodifier * item.filecount
            if s <= 0:
                return item.getRandomFile(dither=dither)

        # failsafe
        return self.contents[-1]

    def getUnderplayedSongs(self):
        normalized_contents = self.contents[:]
        normalized_contents.sort(key=lambda x: safeDivide(x.play_count, x.getProbability(), x.filecount))
        bottom_10 = len(normalized_contents)//10 + 1
        for i in normalized_contents[:bottom_10]:
            yield (i.path, safeDivide(i.play_count, i.getProbability(), i.filecount))

    def getProbability(self):
        if self.parent is None:
            return 1.0
        else:
            return self.parent.getChildProbability(self)

    def getChildProbability(self, child):
        return self.getProbability() * (child.filecount * child.pmodifier) / fsum(map(lambda x: x.filecount * x.pmodifier, self.contents))

    def updatePlayCount(self, amount):
        self.play_count += 1
        if self.parent is not None:
            self.parent.updatePlayCount(amount)

    def findFile(self, path):
        path = os.path.normpath(path)
        sameitems = [] #this is because the paths may be the same for some files but they
                       #they only have a partial match in some directories
                       #so you want to find the longest path
        for item in self.contents:
            try:
                cprefix = os.path.commonprefix([os.path.normpath(item.path), path])
            except:
                print([os.path.normpath(item.path), path])
                raise
            if os.path.exists(cprefix) and os.path.samefile(cprefix, item.path):
                sameitems.append(item)

        #return the one that has the longest match
        if len(sameitems) > 0:
            return max(sameitems, key=lambda x: len(os.path.commonprefix([os.path.normpath(x.path), path]))).findFile(path)

        return None
        

    def modifyProbability(self, amount):
        if self.parent is not None:
            self.pmodifier *= amount
            self.parent.modifyProbability(amount ** .7)

    def updateChanges(self):
        filesAdded = 0

        if not hasattr(self, 'mtime'):
            self.mtime = os.path.getmtime(self.path)
            for f in self.contents:
                filesAdded += f.updateChanges()

        itemsForDeletion = []

        for i, item in enumerate(self.contents):
            if not item.exists():
                itemsForDeletion.append(i)

        for i in itemsForDeletion[::-1]:
            filesAdded -= self.contents[i].filecount
            del self.contents[i]

        cset = {item.path: item for item in self.contents}#set(map(lambda x: x.path, self.contents))

        dirs = []

        for item in os.listdir(self.path):
            item = os.path.join(self.path, item)
            if item in cset and os.path.getmtime(item) > cset[item].mtime:
                filesAdded += cset[item].updateChanges()

            elif item not in cset:
                if os.path.isfile(item):
                    if item.split('.')[-1] in Directory.acceptable:
                        self.contents.append(File(item, self))
                        filesAdded += 1

                elif os.path.isdir(item):
                    dirs.append(item)

        for directory in dirs:
            newDir = Directory(directory, parent=self)
            self.merge(newDir)

        self.filecount += filesAdded
        return filesAdded
    
    def exists(self):
        return os.path.exists(os.path.expanduser(self.path))

    def printHierarchy(self):
        nonEmptyFiles = list(filter(lambda x: x.filecount > 0, self.contents))
        nonEmptyFiles.sort(key=lambda x: x.getProbability() / x.filecount, reverse=True)
        mingood = nonEmptyFiles[-1].getProbability() / nonEmptyFiles[-1].filecount
        for i in nonEmptyFiles:
            print(i.path, i.getProbability() / i.filecount / mingood)
            
    def resetFileCounts(self):
        """
        Shitty hack for something that should be working
        """
        filecount = 0
        for f in self.contents:
            filecount += f.resetFileCounts()
        
        self.filecount = int(filecount)
        return filecount


class File(object):
    like_increase = 1.03
    like_decrease = 1 / 1.03

    def __init__(self, path, parent):
        self.path = path
        self.pmodifier = 1.0
        self.parent = parent
        self.filecount = 1
        self.play_count = 0
        self.mtime = os.path.getmtime(self.path)
        print(self.path)

    def getRandomFile(self, dither=None):
        return self

    def getAllFiles(self):
        yield self

    def update(self):
        if self.parent is not None:
            self.parent.update(1)

    def getProbability(self):
        if self.parent is None:
            return 1.0
        else:
            return self.parent.getChildProbability(self)

    def updatePlayCount(self, amount=1):
        self.play_count += amount
        if self.parent is not None:
            self.parent.updatePlayCount(amount)

    def modifyProbability(self, amount):
        self.pmodifier *= amount
        if self.parent is not None:
            self.parent.modifyProbability(amount ** .7)

    def findFile(self, path):
        path = os.path.normpath(path)
        if os.path.samefile(self.path, path):
            return self
        return None

    def updateChanges(self):
        if not hasattr(self, 'mtime'):
            self.mtime = os.path.getmtime(self.path)

        return 0

    def exists(self):
        return os.path.exists(os.path.expanduser(self.path))
    
    def resetFileCounts(self):
        return 1
    
if __name__ == '__main__':
    a = pickle.load(open('./preferences.dat', 'rb'))
    files = a.getAllFiles()
    files = list(filter(lambda x: x.play_count == 0, files))
    print(len(files))

    def findstart(strings):
        s = strings[0]
        imax = len(s)
        for string in strings:
            while imax > 0 and (not string.startswith(s[:imax])):
                imax -= 1
            if imax == 0:
                return ''
            s = s[:imax]

        return s
    
    
    try:
        if sys.argv[-1] == 'print':
            l = len(findstart(list(map(lambda x: x.path, files))))
            for i in files:
                print(i.path[l:])
        if sys.argv[-1] == 'order':
            for i in a.getUnderplayedSongs():
                print(i)
    except IndexError:
        pass
    except:
        raise
