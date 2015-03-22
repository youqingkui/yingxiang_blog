// Generated by CoffeeScript 1.8.0
(function() {
  var Evernote, asycn, client, express, noteStore, router;

  express = require('express');

  router = express.Router();

  asycn = require('async');

  Evernote = require('evernote').Evernote;

  client = require('../servers/ervernote');

  noteStore = client.getNoteStore();


  /* GET home page. */

  router.get('/', function(req, res, next) {
    res.render('index', {
      title: 'Express'
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
    return noteStore.getNote(noteGuid, true, false, false, false, function(err, note) {
      if (err) {
        return console.log(err);
      }
      console.log(note);
      return res.render('note', {
        content: note.content
      });
    });
  });

  module.exports = router;

}).call(this);

//# sourceMappingURL=index.js.map
