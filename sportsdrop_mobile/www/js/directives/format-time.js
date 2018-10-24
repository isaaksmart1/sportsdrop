angular.module('directive.formatclock', [])

  .directive('formattedTime', function ($filter) {
    return {
      require: '?ngModel',
      link: function (scope, elem, attr, ngModel) {
        if (!ngModel)
          return;
        if (attr.type !== 'time')
          return;
        ngModel.$formatters.unshift(function (value) {
          // add on 30 minutes from now
          var date = new Date(Date(value));
          date = new Date((date.getTime() + 30 * 60000));
          value = date.toTimeString().split(' ')[0];
          return value.replace(/:[0-9]+$/, '');
        });
      }
    };
  });
