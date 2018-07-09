exports.runHealthChecks = async function (db) {
  // Checks database connectivity by auth attempt
  function databaseConnectivityCheck () {
    return db.sequelize.authenticate()
  }

  function handleResolve ({label, promise}) {
    promise = promise.then(() => {
      return {[label]: true}
    })
    return {label, promise}
  }

  function handleReject ({label, promise}) {
    return promise.catch(err => {
      console.error(err)
      return {[label]: false}
    })
  }

  /**
   * Summarize the results of all checks in to a report of the form of:
   * {
   *   ok: <overall status>,
   *   checks: [
   *     {check1: <check1 status>},
   *     {check2: <check2 status>}
   *   ]
   * }
   * @param results
   * @returns {{ok: boolean, checks: *}}
   */
  function summarize (results) {
    const overallStatus = {
      ok: false,
      checks: results
    }

    overallStatus.ok = results.reduce((acc, result) => {
      return acc && Object.values(result).reduce((acc, val) => acc && val, true)
    }, true)

    return overallStatus
  }

  /**
   * Runs all health checks defined in `checks` and returns an array
   * with the results in the form of:
   * [
   *   {check1: <check1 status>},
   *   {check2: <check2 status>}
   * ]
   */
  function run () {
    // Add additional health checks to this array
    const checks = [{
      label: 'Database Connectivity', promise: databaseConnectivityCheck()
    }]
      .map(handleResolve)
      .map(handleReject)

    return Promise.all(checks)
  }

  const results = await run()
  return summarize(results)
}
