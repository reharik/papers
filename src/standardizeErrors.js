
module.exports = (result) => {
  const status = result.details.status ? result.details.status : result.type === "fail"? 401 : 500;

  if (typeof result.details === 'string') {
    return {
      errorMessage: result.details,
      statusCode:status,
      exception: result.details
    }
  }

  if (typeof result.details.error === 'Error') {
    return {
      errorMessage: result.details.error.message,
      statusCode:status,
      exception: result.details.error
    }
  }

  if (typeof result.details.error === 'string') {
    return {
      errorMessage: result.details.error,
      statusCode:status,
      exception:result. details.error
    }
  }
};