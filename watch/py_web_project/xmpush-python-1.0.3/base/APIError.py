
class APIError(Exception):
    """
    raise APIError if receiving json message indicating failure.
    """
    def __init__(self, error_code, error, request):
        self.error_code = error_code
        self.error = error
        self.request = request
        Exception.__init__(self, error)

    def __str__(self):
        return 'APIError: %s: %s, request: %s' % (self.error_code, self.error, self.request)
