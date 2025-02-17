import Controller from '@ember/controller';

export default class DocsController extends Controller {
  docTree = [
    {
      "name": "Documentation",
      "link": false,
      "value": [
        {
          "name": "Core",
          "link": false,
          "value": [
            {"name": "Project template", "value":"https://raw.githubusercontent.com/mu-semtech/mu-project/master/README.md", "link": true},
            {"name": "Identifier", "value":"https://raw.githubusercontent.com/mu-semtech/mu-identifier/master/README.md", "link": true},
            {"name": "Dispatcher", "value":"https://raw.githubusercontent.com/mu-semtech/mu-dispatcher/master/README.md", "link": true},
            {"name": "Authorization (new)", "value":"https://raw.githubusercontent.com/mu-semtech/sparql-parser/master/README.md", "link": true},
            {"name": "Authorization (old)", "value":"https://raw.githubusercontent.com/mu-semtech/mu-authorization/master/README.md", "link": true},
            {"name": "Delta notifier", "value":"https://raw.githubusercontent.com/mu-semtech/delta-notifier/master/README.md", "link": true}
          ]
        },
        {
          "name": "Templates",
          "link": false,
          "value": [
            {"name": "Javascript template", "value":"https://raw.githubusercontent.com/mu-semtech/mu-javascript-template/master/README.md", "link": true},
            {"name": "Ruby template", "value":"https://raw.githubusercontent.com/mu-semtech/mu-ruby-template/master/README.md", "link": true},
            {"name": "Python template", "value":"https://raw.githubusercontent.com/mu-semtech/mu-python-template/master/README.md", "link": true},
          ]
        },
        {
          "name": "Microservices",
          "link": false,
          "value": [
            {"name": "Login service", "value":"https://raw.githubusercontent.com/mu-semtech/login-service/master/README.md", "link": true},
            {"name": "Registration service", "value":"https://raw.githubusercontent.com/mu-semtech/registration-service/master/README.md", "link": true},
            {"name": "Resources service", "value":"https://raw.githubusercontent.com/mu-semtech/mu-cl-resources/master/README.md", "link": true},
            {"name": "File service", "value":"https://raw.githubusercontent.com/mu-semtech/file-service/master/README.md", "link": true},
            {"name": "Migrations service", "value":"https://raw.githubusercontent.com/mu-semtech/mu-migrations-service/master/README.md", "link": true},
            {"name": "Search", "value":"https://raw.githubusercontent.com/mu-semtech/mu-search/master/README.md", "link": true},
            {"name": "Cache", "value":"https://raw.githubusercontent.com/mu-semtech/mu-cache/master/README.md", "link": true},
          ]
        },
        {
          "name": "Ember addons",
          "link": false,
          "value": [
            {"name": "Data table", "value":"https://raw.githubusercontent.com/mu-semtech/ember-data-table/master/README.md", "link": true},
            {"name": "Login addon", "value":"https://raw.githubusercontent.com/mu-semtech/ember-mu-login/master/README.md", "link": true},
            {"name": "Registration addon", "value":"https://raw.githubusercontent.com/mu-semtech/ember-mu-registration/master/README.md", "link": true},
            {"name": "Transform helpers", "value":"https://raw.githubusercontent.com/mu-semtech/ember-mu-transform-helpers/master/README.md", "link": true},
          ]
        },
        {
          "name": "Tools",
          "link": false,
          "value": [
            {"name": "mu-cli", "value":"https://raw.githubusercontent.com/mu-semtech/mu-cli/master/README.md", "link": true},
            {"name": "Homebrew scripts", "value":"https://raw.githubusercontent.com/mu-semtech/homebrew-scripts/master/README.md", "link": true},
            {"name": "OpenAPI generator", "value":"https://raw.githubusercontent.com/mu-semtech/cl-resources-openapi-generator/master/README.md", "link": true},
          ]
        }
      ]}
  ];
}
