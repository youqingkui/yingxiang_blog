// Generated by CoffeeScript 1.8.0
(function() {
  var Evernote, Note, async, client, express, noteStore, router;

  express = require('express');

  router = express.Router();

  async = require('async');

  Evernote = require('evernote').Evernote;

  client = require('../servers/ervernote');

  noteStore = client.getNoteStore();

  Note = require('../models/note');


  /* GET home page. */

  router.get('/', function(req, res, next) {
    return Note.find(function(err, notes) {
      if (err) {
        return console.log(err);
      }
      return res.render('index', {
        notes: notes
      });
    });
  });

  router.get('/notebooks', function(req, res) {
    return noteStore.listNotebooks(function(err, list) {
      if (err) {
        return console.log(err);
      }
      console.log(list);
      return res.render('notebook', {
        notebooks: list
      });
    });
  });

  router.get('/listnote', function(req, res) {
    var filterNote, guid;
    filterNote = new Evernote.NoteFilter();
    guid = '2e5dc578-8a1d-4303-8be7-5711ea6fa301';
    filterNote.notebookGuid = guid;
    return noteStore.findNotes(filterNote, 0, 10, function(err, notes) {
      if (err) {
        console.log("here");
        return console.log(err);
      }
      console.log(notes);
      return res.render('notes', {
        notes: notes
      });
    });
  });

  router.get('/note/:noteGuid', function(req, res) {
    var noteGuid;
    noteGuid = req.params.noteGuid;
    return Note.findOne({
      guid: noteGuid
    }, function(err, note) {
      if (err) {
        return console.log(err);
      }
      if (note) {
        console.log(note);
        return res.render('note', {
          note: note
        });
      }
    });
  });

  router.get('/test', function(req, res) {
    var filterNote, guid;
    filterNote = new Evernote.NoteFilter();
    guid = '2e5dc578-8a1d-4303-8be7-5711ea6fa301';
    filterNote.notebookGuid = guid;
    return noteStore.findNotes(filterNote, 0, 100, function(err, notes) {
      if (err) {
        return console.log(err);
      }
      async.each(notes.notes, function(item, callback) {
        var newNote;
        newNote = new Note();
        newNote.guid = item.guid;
        newNote.title = item.title;
        newNote.content = item.content;
        newNote.created = item.created;
        newNote.updated = item.updated;
        newNote.deleted = item.deleted;
        newNote.tagGuids = item.tagGuids;
        newNote.notebookGuid = item.notebookGuid;
        return newNote.findSameGuid(function(err, note) {
          if (err) {
            return console.log(err);
          }
          return newNote.save(function(err, noteInfo) {
            if (err) {
              return console.log(err);
            }
            return console.log(noteInfo);
          });
        });
      });
      return res.send("ok");
    });
  });

  router.get('/test_note', function(req, res) {
    return async.auto({
      getDbNote: function(cb) {
        return Note.find(function(err, notes) {
          if (err) {
            return console.log(err);
          }
          return cb(null, notes);
        });
      },
      getNoteInfo: [
        'getDbNote', function(cb, result) {
          var notes;
          notes = result.getDbNote;
          return async.eachSeries(notes, function(item, callback) {
            return noteStore.getNote(item.guid, true, false, false, false, function(err, noteInfo) {
              if (err) {
                return console.log(err);
              }
              item.content = noteInfo.content;
              return item.save(function(err, note) {
                if (err) {
                  return console.log(err);
                }
                console.log(note);
                return callback();
              });
            });
          });
        }
      ]
    });
  });

  router.get('/test_db', function(req, res) {
    var newNote;
    newNote = new Note();
    newNote.guid = '123456333';
    return newNote.findSameGuid(function(err, note) {
      if (err) {
        return console.log(err);
      }
      return console.log(note);
    });
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=index.js.map
