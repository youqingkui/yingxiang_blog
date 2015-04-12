// Generated by CoffeeScript 1.8.0
(function() {
  var Evernote, Note, Sync, Sync2, SyncStatus, Tags, async, client, express, getLocalTime, getYear, help, hexdump, noteStore, router, toInt, uniq;

  express = require('express');

  router = express.Router();

  async = require('async');

  uniq = require('uniq');

  Evernote = require('evernote').Evernote;

  client = require('../servers/ervernote');

  noteStore = client.getNoteStore('https://app.yinxiang.com/shard/s5/notestore');

  Note = require('../models/note');

  Tags = require('../models/tags');

  SyncStatus = require('../models/sync_status');

  Sync = require('../servers/sync');

  Sync2 = require('../servers/sync2');

  help = require('../servers/help');

  getLocalTime = help.getLocalTime;

  getYear = help.getYear;

  toInt = help.toInt;

  hexdump = require('hexdump-nodejs');


  /* GET home page. */

  router.get('/', function(req, res, next) {
    var count, page;
    page = toInt(req.param('page'));
    if (page <= 0 || !page) {
      page = 1;
    }
    count = 0;
    return async.auto({
      getCount: function(cb) {
        return Note.count(function(err, number) {
          if (err) {
            return console.log(err);
          }
          count = Math.ceil(number / 10);
          return cb();
        });
      },
      pageNote: function(cb) {
        return Note.find().sort('-created').skip(10 * (page - 1)).limit(10).exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      },
      getRecentNote: function(cb) {
        return Note.find().sort('-created').limit(4).exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      },
      getTags: function(cb) {
        return Tags.findOne(function(err, tags) {
          if (err) {
            return console.log(err);
          }
          return cb(null, tags);
        });
      }
    }, function(err, result) {
      if (err) {
        return console.log(err);
      }
      return res.render('index', {
        notes: result.pageNote,
        currPage: page,
        countPage: count,
        getLocalTime: getLocalTime,
        recentNote: result.getRecentNote,
        tags: result.getTags.tags,
        title: "友情's 笔记"
      });
    });
  });


  /* 分页获取 */

  router.get('/page/:page', function(req, res) {
    var count, page;
    page = toInt(req.params.page);
    if (page <= 0) {
      page = 1;
    }
    count = 0;
    return async.auto({
      getCount: function(cb) {
        return Note.count(function(err, number) {
          if (err) {
            return console.log(err);
          }
          console.log("count note ==>", number);
          count = Math.ceil(number / 10);
          return cb();
        });
      },
      pageNote: function(cb) {
        return Note.find().sort('-created').skip(10 * (page - 1)).limit(10).exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      }
    }, function(err, result) {
      if (err) {
        return console.log(err);
      }
      return res.render('index', {
        notes: result.pageNote,
        currPage: page,
        countPage: count,
        getLocalTime: getLocalTime,
        title: "友情's 笔记"
      });
    });
  });


  /* 查找对应笔记 */

  router.get('/note/:noteGuid', function(req, res, next) {
    var noteGuid;
    noteGuid = req.params.noteGuid;
    return async.auto({
      findNote: function(cb) {
        return Note.findOne({
          guid: noteGuid
        }, function(err, note) {
          if (err) {
            return console.log(err);
          }
          if (!note) {
            return next();
          }
          return cb(null, note);
        });
      },
      recentNote: function(cb) {
        return Note.find().sort('-created').limit(4).exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      },
      getTags: function(cb) {
        return Tags.findOne(function(err, tags) {
          if (err) {
            return console.log(err);
          }
          return cb(null, tags);
        });
      }
    }, function(autoErr, result) {
      if (autoErr) {
        return console.log(autoErr);
      }
      return res.render('note', {
        note: result.findNote,
        getLocalTime: getLocalTime,
        recentNote: result.recentNote,
        tags: result.getTags.tags,
        title: result.findNote.title
      });
    });
  });


  /* 查找对应标签笔记列表 */

  router.get('/tag/:tag/', function(req, res, next) {
    var query, tag;
    tag = req.params.tag.trim();
    query = "this.tags.indexOf('" + tag + "') > -1";
    return async.auto({
      findNotes: function(cb) {
        return Note.find({}, {
          'title': 1,
          'guid': 1,
          'tags': 1,
          'updated': 1,
          'created': 1
        }).where({
          $where: query
        }).sort('-created').exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          if (!notes.length) {
            return next();
          }
          return cb(null, notes);
        });
      },
      getTags: function(cb) {
        return Tags.findOne(function(err, tags) {
          if (err) {
            return console.log(err);
          }
          return cb(null, tags);
        });
      }
    }, function(autoErr, result) {
      if (autoErr) {
        return console.log(autoErr);
      }
      return res.render('tags_note', {
        notes: result.findNotes,
        tag: tag,
        getLocalTime: getLocalTime,
        tags: result.getTags.tags,
        title: "Tags " + tag
      });
    });
  });


  /* 档案 */

  router.get('/archive', function(req, res) {
    return async.auto({
      getNotes: function(cb) {
        return Note.find({}, {
          'guid': 1,
          'created': 1,
          'title': 1
        }).sort('-created').exec(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      },
      getYear: [
        'getNotes', function(cb, result) {
          var archive, notes;
          notes = result.getNotes;
          archive = {};
          return async.eachSeries(notes, function(item, callback) {
            var year;
            year = getYear(item.created);
            if (!archive[year]) {
              console.log("year ==>", year);
              archive[year] = [];
              archive[year].push(item);
            } else {
              archive[year].push(item);
            }
            return callback();
          }, function(eachErr) {
            if (eachErr) {
              return console.log(eachErr);
            }
            return res.render('archive', {
              archive: archive,
              getLocalTime: getLocalTime,
              title: "Archive List"
            });
          });
        }
      ]
    });
  });

  router.get('/sync', function(req, res) {
    var sync;
    sync = new Sync();
    return async.series([
      function(cb) {
        return sync.checkStatus(function(err) {
          if (err) {
            return cb(err);
          }
          console.log("sync.needSync", sync.needSync);
          if (sync.needSync === false) {
            return res.send("status not change don't need sync");
          } else {
            return cb();
          }
        });
      }, function(cb) {
        return sync.getNoteCount(function(err) {
          if (err) {
            return cb(err);
          }
          return cb();
        });
      }, function(cb) {
        var loopNum, _i, _ref, _results;
        loopNum = (function() {
          _results = [];
          for (var _i = 0, _ref = sync.page; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
        return async.eachSeries(loopNum, function(item, callback) {
          return sync.syncInfo(item * 50, 50, function(err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        }, function(eachErr) {
          if (eachErr) {
            return cb(eachErr);
          }
          return cb();
        });
      }, function(cb) {
        return sync.updateNoteBookTags(function(err) {
          if (err) {
            return cb(err);
          }
          return cb();
        });
      }
    ], function(sErr) {
      if (sErr) {
        return console.log(sErr);
      }
      return res.send("sync new note ok");
    });
  });

  router.get('/test_tag', function(req, res) {
    var guid;
    guid = 'e57abb2a-3997-47f1-b9fe-ac94740130ce';
    return noteStore.getNoteTagNames(guid, function(err, tag) {
      if (err) {
        return console.log(err);
      }
      return console.log(tag);
    });
  });

  router.get('/test1', function(req, res) {
    var filterNote, guid, guid2, reParams;
    guid = 'bd6d5877-9ff8-400d-9d83-f6c4baeb2406';
    guid2 = '225d9cfe-30e7-44e3-a4db-2ebc2575be58';
    filterNote = new Evernote.NoteFilter();
    filterNote.notebookGuid = guid2;
    reParams = new Evernote.NotesMetadataResultSpec();
    reParams.includeTitle = true;
    reParams.includeCreated = true;
    reParams.includeUpdated = true;
    reParams.includeDeleted = true;
    reParams.includeTagGuids = true;
    reParams.includeNotebookGuid = true;
    reParams.includeTagGuids = true;
    return noteStore.findNotesMetadata(filterNote, 0, 500, reParams, function(err, info) {
      if (err) {
        return console.log(err);
      }
      console.log(info);
      return console.log(info.notes.length);
    });
  });

  router.get('/test2', function(req, res) {
    var sync;
    sync = new Sync2();
    return sync.syncInfo(function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });

  router.get('/test3', function(req, res) {
    var sync;
    sync = new Sync2();
    return sync.compleNoteBooksTag(function(err) {
      if (err) {
        return console.log(err);
      }
    });
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=index.js.map
