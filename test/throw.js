// Copyright 2012 The Obvious Corporation.
var Q = require('kew')

// set up a graph for testing
exports.setUp = function (done) {
  this.error = new Error('This should break')
  this.graph = new (require ('../lib/shepherd')).Graph
  done()
}

// errors thrown at top level should be caught and fed to the run() request
exports.testErrorThrown = function (test) {
  var error = this.error

  // add a node which throws an error
  this.graph.add('throws', function () {
    throw error
  })

  this.graph.newBuilder()
    .builds('throws')
    .run({}, function (err, result) {
      test.equal(err, error, 'Error should be returned to run() callback')
    })
    .then(function (result) {
      test.equal(result, undefined, 'Result should not be returned through promise')
    })
    .fail(function (err) {
      test.equal(err, error, 'Error should be returned through promise.fail()')
    })
    .then(function () {
      test.done()
    })
    .end()
}

// errors returned through next() should be caught and fed to the run() request
exports.testErrorViaCallback = function (test) {
  var error = this.error

  // add a node which throws an error
  this.graph.add('throws', function (next) {
    return next(error)
  })

  this.graph.newBuilder()
    .builds('throws')
    .run({}, function (err, result) {
      test.equal(err, error, 'Error should be returned to run() callback')
    })
    .then(function (result) {
      test.equal(result, undefined, 'Result should not be returned through promise')
    })
    .fail(function (err) {
      test.equal(err, error, 'Error should be returned through promise.fail()')
    })
    .then(function () {
      test.done()
    })
    .end()
}

// errors returned through a rejected promise should be caught and fed to the run() request
exports.testErrorViaPromise = function (test) {
  var error = this.error

  // add a node which throws an error
  this.graph.add('throws', function (next) {
    var deferred = Q.defer()
    deferred.reject(error)
    return deferred.promise
  })

  this.graph.newBuilder()
    .builds('throws')
    .run({}, function (err, result) {
      test.equal(err, error, 'Error should be returned to run() callback')
    })
    .then(function (result) {
      test.equal(result, undefined, 'Result should not be returned through promise')
    })
    .fail(function (err) {
      test.equal(err, error, 'Error should be returned through promise.fail()')
    })
    .then(function () {
      test.done()
    })
    .end()
}

// errors should return with graphInfo field
exports.testThrowWithGraphInfo = function (test) {
  // add a node which throws an error
  this.graph.add('throws', function (next) {
    throw new Error('Threw an error')
  })

  this.graph.add('first', this.graph.subgraph)
    .builds('throws')

  this.graph.add('second', this.graph.subgraph)
    .builds('first')

  this.graph.add('third', this.graph.subgraph)
    .builds('second')

  this.graph.newBuilder('builtToFail')
    .builds('third')
    .run({}, function (err, result) {
      var graphInfo = err.graphInfo
      test.equal(graphInfo.builderName, 'builtToFail', 'builder name should be builtToFail')

      var failureNodes = graphInfo.failureNodeChain
      test.equal(failureNodes[0].originalNodeName, 'throws', 'throws should be the first node in the chain')
      test.equal(failureNodes[1].originalNodeName, 'first', 'first should be the second node in the chain')
      test.equal(failureNodes[2].originalNodeName, 'second', 'second should be the third node in the chain')
      test.equal(failureNodes[3].originalNodeName, 'third', 'third should be the fourth node in the chain')
    })
    .then(function (result) {
      test.equal(result, undefined, 'Result should not be returned through promise')
    })
    .fail(function (err) {
      var graphInfo = err.graphInfo
      test.equal(graphInfo.builderName, 'builtToFail', 'builder name should be builtToFail')

      var failureNodes = graphInfo.failureNodeChain
      test.equal(failureNodes[0].originalNodeName, 'throws', 'throws should be the first node in the chain')
      test.equal(failureNodes[1].originalNodeName, 'first', 'first should be the second node in the chain')
      test.equal(failureNodes[2].originalNodeName, 'second', 'second should be the third node in the chain')
      test.equal(failureNodes[3].originalNodeName, 'third', 'third should be the fourth node in the chain')
    })
    .then(function () {
      test.done()
    })
    .end()
}