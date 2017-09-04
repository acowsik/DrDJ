import os
import random
import pickle


class Directory(object):
    acceptable = {u'mp3'}#{u'mp3', u'wav', u'ogg', u'm4a'}

    def __init__(self, path, parent=None):
        self.parent = parent
        self.path = path
        self.probability = -1.0
        self.folder = []
        self.files_contained = -1
        self.time_modified = 0.0

        inside = os.listdir(path)

        self.inside = set(inside)

        for item in inside:
            fullPath = os.path.join(self.path, item)
            if os.path.isfile(fullPath) and self.is_acceptable(fullPath):
                self.folder.append(File(fullPath, self))
            elif os.path.isdir(fullPath):
                self.folder.append(Directory(fullPath, parent=self))

        self.reset_files_contained()

    def add_new_files(self):
        for item in os.listdir(self.path):
            if item not in self.inside:
                self.inside.add(item)
                fullPath = os.path.join(self.path, item)
                if os.path.isfile(fullPath) and self.is_acceptable(fullPath):
                    self.folder.append(File(fullPath, self))
                elif os.path.isdir(fullPath):
                    self.folder.append(Directory(fullPath, parent=self))


    def reset_files_contained(self):
        """

        :rtype: int
        """
        self.add_new_files()

        contained = 0

        for item in self.folder:
            contained += item.reset_files_contained()

        self.files_contained = contained
        return contained

    def get_file(self, filepath):
        for f in self.folder:
            if f.matches_partialpath(filepath):
                return f.get_file(filepath)
        return None

    def matches_partialpath(self, filepath):
        return filepath.lower().startswith(self.path.lower())


    def reset_probabilities(self):
        number_of_files = self.reset_files_contained()
        if number_of_files == 0:
            return

        total_probability = 0.0

        for item in self.folder:
            if item.probability == -1:
                item.probability = item.files_contained / float(number_of_files)
            total_probability += item.probability

        for item in self.folder:
            item.probability /= total_probability
            item.reset_probabilities()

    def normalize(self):
        total_probability = 0.0
        for item in self.folder:
            total_probability += item.probability

        for item in self.folder:
            item.probability /= total_probability

    @staticmethod
    def is_acceptable(path):
        """
        @rtype: bool
        """
        return os.path.basename(path).split('.')[-1] in Directory.acceptable

    def get_random_file(self):
        r = random.random()
        for item in self.folder:
            r -= item.probability
            if r < 0:
                return item.get_random_file()

        return self.folder[-1].get_random_file()

    def get_all_files(self):
        """

        @rtype: list[File]
        """
        all_files = []
        for item in self.folder:
            all_files.extend(item.get_all_files())

        return all_files

    def get_probability(self):
        """

        @rtype: float
        """
        if self.parent is None:
            return 1.0
        else:
            return self.probability * self.parent.get_probability()

    def like(self, distance):
        """
        :param distance: int
        """
        if self.parent is not None:
            self.probability *= 1 + File.like_change / (distance + 1) ** 1.1
            self.parent.like(distance + 1)

    def dislike(self, distance):
        """
        :param distance: int
        """
        if self.parent is not None:
            self.probability *= 1 + File.dislike_change / (distance + 1) ** 1.1
            self.parent.dislike(distance + 1)

    def getNthFile(self, n):
        """
        :param n: int
        :rtype: File
        """
        n %= self.files_contained

        for item in self.folder:
            if item.files_contained == 0:
                continue
            n -= item.files_contained
            if n <= 0:
                n += item.files_contained
                return item.getNthFile(n)

    def iterate_through_files(self):
        for f in self.folder:
            for f_ in f.iterate_through_files():
                yield f_

    def getNextFileWithoutInformation(self, shouldIgnoreFailed=True):
        """

        :param shouldIgnoreFailed:
        :type shouldIgnoreFailed: bool
        :return: a file which needs processing
        :rtype: File
        """

        MAX_TRIES_PER_FILE = 15
        # for i in xrange(self.files_contained):
        #    f = self.getNthFile(i)
        #    if (not hasattr(f, 'information')) or (f.information == '' and (not shouldIgnoreFailed)):#(not hasattr(f, 'information')) or (not shouldIgnoreFailed and f.information == ''):
        #        return f
        # for some reason the getNthFile function doesn't actually work
        if shouldIgnoreFailed:
            for f in self.iterate_through_files():
                if (not hasattr(f, 'information')) or (not shouldIgnoreFailed and f.information == ''):
                    return f
            return None
        else:
            failed = filter(lambda x: (not hasattr(x, 'tries') or x.tries < MAX_TRIES_PER_FILE) and (
                (not hasattr(x, 'information')) or x.information == '' or (f.information['speechiness'] is None)),
                            self.iterate_through_files())
            if len(failed) != 0:
                ret = random.choice(failed)
                if hasattr(ret, 'tries'):
                    ret.tries += 1
                else:
                    ret.tries = 0
                return ret
            else:
                return None

    def __hash__(self):
        return hash(self.path)


class File(object):
    like_change = .2
    dislike_change = -.17

    def __init__(self, path, parent):
        self.path = path
        self.probability = -1.0
        self.files_contained = 1
        self.parent = parent

    def matches_partialpath(self, filepath):
        return filepath.lower().startswith(self.path.lower())

    def get_file(self, useless):
        return self

    def iterate_through_files(self):
        yield self

    @staticmethod
    def reset_files_contained():
        return 1

    @staticmethod
    def reset_probabilities():
        pass

    def get_random_file(self):
        return self

    def get_all_files(self):
        return [self]

    def get_probability(self):
        return self.probability * self.parent.get_probability()

    def like(self):
        self.probability *= 1.0 + File.like_change
        self.parent.like(1)

    def dislike(self):
        self.probability *= 1.0 + File.dislike_change
        self.parent.dislike(1)

    def getNthFile(self, n):
        """
        :param n: int
        :rtype: File
        """
        return self

    def __hash__(self):
        return hash(self.path)

