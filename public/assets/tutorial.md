<a id="org81e192f"></a>

# Foreword

In this tutorial we create a books application. Following the tutorial will help to get started with semantic.works.


<a id="orgd409ec0"></a>

## Prerequisites

-   docker
-   docker compose
-   user namespaces or something similar (or recreate the generated files)


<a id="orgd1efaeb"></a>

## Conventions and alternatives


<a id="orgc617db1"></a>

### docker-ember

This tutorial uses [docker-ember](https://github.com/madnificent/docker-ember) to run ember-cli commands. Whenever the bash command `edi some other args` is used, and you have ember-cli natively installed instead, just run `some other args` instead. `eds --proxy http://host/` would become `ember serve --proxy "http://localhost/"` (note the difference between host and localhost).


<a id="orgccbb5a2"></a>

### user namespaces

This tutorial assumes user namespaces are applied so files generated by Docker are owned by your user. If that is not the case in your setup run `sudo chown "$USER:$USER" generated-file-path` on the generated files after generation. This will ensure you can edit them directly.


<a id="orge4c26ad"></a>

### mu-cli

This tutorial uses [mu-cli](https://github.com/mu-semtech/mu-cli) to generate and update configuration files. Most of these can be generated by hand. The corresponding manual commands will be suggested in the tutorial. We do strongly advise the use of mu-cli when using semantic.works.

For docker compose commands we supply commands from mu-cli. However, in practice many users have a configuration where bash picks up docker-compose.yml, docker-compose.dev.yml and docker-compose.override.yml if they exist as these are the conventions on dev machines. We don't use a .env because we want to be really sure this would not accidentally land on production. Further, `docker compose` is generally aliased to `drc` for easy typing.


<a id="org87685ab"></a>

# A new application!

Our application will consist of a frontend application and a backend application. The frontend will be implemented in [ember.js](https://emberjs.com/) and the backend will be made as a [semantic.works](https://semantic.works) backend in docker compose.


<a id="org0519dc7"></a>

## Generating the backend application

To create a new application in the current folder, let's run the generate script.

```bash
mu project new app-book-collection
```

Without mu this would execute:

```bash
git clone https://github.com/mu-semtech/mu-project app-book-collection
rm -Rf app-book-collection/.git
cd app-book-collection
git init .
git add .
git commit -a -m "Creating new mu project"
```


<a id="orga7e26a4"></a>

## Generating the frontend application

We can generate an ember frontend with a specific version using the following command.

```bash
EDI_EMBER_VERSION="5.12.0" edi ember new frontend-book-collection
```

This will generate our new frontend.


<a id="orgcf4690a"></a>

## Current state

At this point you should have two folders:

-   **app-book-collection:** the backend, prefixed with `app-` by convention
-   **frontend-book-collection:** the frontend, prefixed with `frontend-` by convention


<a id="org208987b"></a>

## Starting everything


<a id="org833422e"></a>

### The backend

The backend can be started by running:

```bash
cd app-book-collection
mu start dev
```

This command will launch the `docker-compose.yml` (for production) augmented with changes for development in `docker-compose.dev.yml`.

```bash
cd app-book-collection
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

View the logs through

```bash
cd app-book-collection
mu logs
```

or

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -ft --tail=100
```

Check if we're getting a response through curl:

```bash
curl http://localhost/
```

We get a 404 route not found. Exactly what we want!

If you want to look at the triplestore, there's a direct connection to Virtuoso available on port 8890. <http://localhost:8890/sparql> has an interface to query the triplestore directly.


<a id="orgf3806d7"></a>

### The frontend

Our frontend has the default libraries installed. Let's start a live reloading session:

```bash
cd frontend-book-collection
eds --proxy http://host/
```

This will proxy the ember server to our locally running backend with all node dependencies running in docker where they can't steal your bitcoin or do other crazy things on your system.

The frontend is hosted on port 4200. If you open it in your browser you'll see a welcome page. Looks like that works too! You can keep that running.


<a id="org81543bd"></a>

# Creating a book collection

The backend comes with mu-cl-resources installed. Let's define a resource to store books and publish the API.


<a id="org8828a86"></a>

## An API for books

[mu-cl-resources](https://github.com/mu-semtech/mu-cl-resources) is installed by default and offers a [{json:api}](https://jsonapi.org) compliant backend with minimal configuration.

We can use the following configuration. The configuration is stored in `app-book-collection/config/resources/domain.json`. The config folder holds all microservice configuration which isn't stored in environment variables. The `resources` folder is the folder used for configuring mu-cl-resources as can be found in the docker-compose.yml service. The `domain.json` name is a convention.

Add the following content:

```json
{
  "version": "0.1",
  "prefixes": {
    "schema": "http://schema.org/"
  },
  "resources": {
    "books": {
      "name": "book",
      "class": "schema:Book",
      "attributes": {
        "title": {
          "type": "string",
          "predicate": "schema:headline"
        },
        "isbn": {
          "type": "string",
          "predicate": "schema:isbn"
        },
        "publication-date": {
          "type": "date",
          "predicate": "schema:datePublished"
        },
        "genre": {
          "type": "string",
          "predicate": "schema:genre"
        },
        "language": {
          "type": "string",
          "predicate": "schema:inLanguage"
        },
        "number-of-pages": {
          "type": "integer",
          "predicate": "schema:numberOfPages"
        }
      },
      "features": ["include-uri"],
      "new-resource-base": "http://example.com/books/"
    }
  }
}
```

This will make mu-cl-resources host books on its own `/books` path with the properties:

-   **title:** connected through the predicate `schema:headline`
-   **isbn:** connected through the predicate `schema:isbn`
-   **publication-date:** connected through the predicate `schema:datePublished`
-   **genre:** connected through the predicate `schema:genre`
-   **language:** connected through the predicate `schema:inLanguage`
-   **number-of-pages:** connected through the predicate `schema:numberOfPages`

New resources will be made by appending a uuid to `http://example.com/books/` which ideally is nested in a domain where this application will be hosted.


<a id="org60dc29d"></a>

## Add a dispatcher rule

When adding a new resource to our application, we also have to update the dispatcher configuration such that incoming requests for book resources get dispatched to our new service. The configuration is stored in `config/dispatcher/dispatcher.ex`.

Add the following content just above the `match "/*_"` rule that is already present in the file:

```elixir
match "/books/*path", @json do
  Proxy.forward conn, path, "http://resource/books/"
end
```


<a id="orga6874e4"></a>

## Restarting resources and dispatcher

With this configuration hosted, restart resources and dispatcher.

```bash
docker compose restart resource dispatcher
```


<a id="org65856f3"></a>

## Displaying books in the frontend

EmberJS applications roughly follow the Web-MVC pattern. The applications have a rigid folder-structure, most content being in the app folder. Ember-cli uses generators to generate basic stubs of content. Since the APIs we're using follow the json-api specification, we can avoid writing custom adapter and serialiser code by simply generating default ones for our application to use if a specific one is not specified:

```bash
edi ember generate adapter application
edi ember generate serializer application
```

We will generate the books model together with a route and controller to display them using ember-cli:

```bash
edi ember generate model book title:string isbn:string
edi ember generate route books
edi ember generate controller books
```

The terminal output shows the created and updated files. The Ember app will automatically reload.

We will fetch all books and render them in our template. In `app/routes/books.js`

```javascript
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class BooksRoute extends Route {
  @service store;

  model() {
    return this.store.findAll('book');
  }
}
```

We’ll display the found records in our template so we’re able to see the created records later on.

First, remove the `<WelcomPage />` component from `app/templates/application.hbs`.

Next, add the following content to `app/templates/books.hbs`

```hbs
<h1>Books</h1>

<ul>
  {{#each @model as |book|}}
    <li>
      {{book.title}} <small>{{book.isbn}}</small>
    </li>
  {{else}}
    <li>No books yet</li>
  {{/each}}
</ul>
```

When you go to <http://localhost:4200/books> you should see an empty list of books.


<a id="orgf8df5a9"></a>

## Creating new books

We’ll add a small input-form through which we can create new books at the bottom of our listing. Two input fields and a create button will suffice for our example.

In the `app/templates/book.hbs` template, we’ll add our create fields and button:

```hbs
<hr />
<form {{on "submit" this.createBook}} >
  <dl>
    <dt>Book title</dt>
    <dd>
       <Input @value={{this.newTitle}}
              placeholder="Thinking Fast and Slow" />
    </dd>
    <dt>ISBN</dt>
    <dd>
      <Input @value={{this.newIsbn}}
             placeholder="978-0374533557" />
    </dd>
  </dl>
  <button type="submit">Create</button>
</form>
```

We’ll add this action in the controller and make it create the new book. In `app/controllers/books.js` add the following:

```javascript
import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class BooksController extends Controller {
  @tracked newTitle = '';
  @tracked newIsbn = '';

  @service store;

  @action
  createBook(event) {
    event.preventDefault();
    // create the new book
    const book = this.store.createRecord('book', {
      title: this.newTitle,
      isbn: this.newIsbn,
    });
    book.save();
    // clear the input fields
    this.newTitle = '';
    this.newIsbn = '';
  }
}
```


<a id="org0c2ff43"></a>

## Removing books

Removing books follows a similar path to creating new books. We add a delete button to the template, and a delete action to the controller.

In `app/templates/book.hbs` we alter:

```diff
=    <li>
=      {{book.title}}<small>{{book.isbn}}</small>
+      <button type="button" {{on "click" (fn this.removeBook book)}}>Remove</button>
=    </li>
```

In `app/controllers/books.js` we alter:

```diff
=      this.newTitle = '';
=      this.newIsbn = '';
=    }
+
+    @action
+    removeBook(book, event) {
+      event.preventDefault();
+      book.destroyRecord();
+    }
=  }
```


<a id="orgba73fa0"></a>

# Writing a custom microservice

mu-cl-resources offers an easy way to create individual resources. This solution tends to be sufficient in practice but special cases may require you to build a custom service. Let's implement a limited listing and creation of books and their headlines.


<a id="org6df3152"></a>

## Creating a new microservice

mu-cli offers a script to generate a new microservice.

```bash
mu service new python special-books-service
```

In the background the script created a Dockerfile and created a basic `web.py` and initialized a Git repository for you. Contents below if you want to manually create these instead.

-   **Dockerfile:** This is all that's needed to make a build using Docker. See the `ONBUILD` statements from
    
    ```dockerfile
    FROM semtech/mu-python-template:2.0.0-beta.2
    LABEL maintainer="maintainer@example.com"
    ```

-   **web.py:** This is enough to run a basic microservice.
    
    ```python
    # see https://github.com/mu-semtech/mu-python-template for more info"
    @app.route("/hello")
    def hello():
        return "Hello from the mu-python-template!"
    ```

The script will output a development snippet such as:

```yaml
special-books:
  image: semtech/mu-python-template:2.0.0-beta.2
  ports:
    - "8888:80"
  environment:
    MODE: "development"
  volumes:
    - "/absolute/path/to/books-service/:/app/"
```


<a id="org54e04c5"></a>

## Starting up the new service in dev mode

Let's add the script to our `app-book-collection/docker-compose.yml` file for now. We like to add the custom services under the identifier and dispatcher, but anything nested in services will suffice:

```diff
services:
+  special-books:
+    image: semtech/mu-python-template:2.0.0-beta.2
+    ports:
+      - "8888:80"
+    environment:
+      MODE: "development"
+    volumes:
+      - "/absolute/path/to/books-service/:/app/"
```

Then up the stack:

```bash
mu start dev # or docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Our service will be started and can be checked out easily:

```bash
mu logs # or docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -ft --tail=100
```


<a id="org39d58e5"></a>

## Verifying our service is running

Let's send a call to see if we get a response:

```restclient
GET http://localhost:8888/hello
```

```html
<!-- GET http://localhost:8888/hello -->
<!-- HTTP/1.1 200 OK -->
<!-- Server: Werkzeug/2.1.2 Python/3.8.12 -->
<!-- Date: Sat, 15 Feb 2025 14:12:00 GMT -->
<!-- Content-Type: text/html; charset=utf-8 -->
<!-- Content-Length: 34 -->
<!-- Connection: close -->
<!-- Request duration: 0.032523s -->
```

Looks like the service works. When we update the returned string, the service should reload and give us new output. Let's try it.

```diff
-     return "Hello from the mu-python-template!"
+     return "Hello from semantic.works tutorial"
```

Our `mu logs` will show the service has reloaded.


<a id="orgd5b31e8"></a>

## Creating two new routes

Instead of hello, we will create a list route and a create route.

We will update the web.py for this case:

```diff
- @app.route("/hello")
- def hello():
-     return "Hello from semantic.works tutorial"
+ @app.route("/special-books/", methods=["GET"])
+ def listBooks():
+     return "Listing books"
+ 
+ @app.route("/special-books/", methods=["POST"])
+ def createBook():
+     return "Creating book"
```

After saving the file the service will automatically reload. Mind the trailing `/` in `"/special-books/"` as it will have an impact when forwarding from dispatcher later.

Let's verify our routes are working:

```restclient
GET http://localhost:8888/special-books/
```

```html
Listing books
<!-- GET http://localhost:8888/special-books -->
<!-- HTTP/1.1 200 OK -->
<!-- Server: Werkzeug/2.1.2 Python/3.8.12 -->
<!-- Date: Sat, 15 Feb 2025 14:44:52 GMT -->
<!-- Content-Type: text/html; charset=utf-8 -->
<!-- Content-Length: 13 -->
<!-- Connection: close -->
<!-- Request duration: 0.033417s -->
```

```restclient
POST http://localhost:8888/special-books/
```

```html
Creating book
<!-- POST http://localhost:8888/special-books/ -->
<!-- HTTP/1.1 200 OK -->
<!-- Server: Werkzeug/2.1.2 Python/3.8.12 -->
<!-- Date: Sat, 15 Feb 2025 16:27:21 GMT -->
<!-- Content-Type: text/html; charset=utf-8 -->
<!-- Content-Length: 13 -->
<!-- Connection: close -->
<!-- Request duration: 0.040968s -->
```

These routes yielded the expected (static) response.


<a id="orgba9f2ec"></a>

## Wiring up the dispatcher

The service needs to be wired up to the stack. We will not execute calls to port `8888` from the frontend but rather want to connect through the identifier.

When we now make calls to the full backend, we still get a 404 instead of our microservice responding:

```restclient
GET http://localhost/special-books
```

```fundamental
Route not found.  See config/dispatcher.ex
// GET http://localhost/special-books/
// HTTP/1.1 404 Not Found
// cache-control: max-age=0, private, must-revalidate
// content-length: 42
// date: Sat, 15 Feb 2025 15:08:11 GMT
// server: Cowboy
// set-cookie: proxy_session=QTEyOEdDTQ.TmgOpaIXVP7TfOwv-x0YOn_bF7FOsF_cM47RnvVTGe1--USdNDNSbEVqK_0.7eoIaBj2XH0_TBB0.vRQ42LE8aRLOKFUKkfWG3qFqOdASnVLt-hITpzf0v-9o8olE_swaH0zg-1aFCp54RDB2i18_8pmDcGs242k4ZCiL0dr03KeFii4tWI5UpdQHd0iSUZrAkaKGFwyg.e9Jkcq_5D0n-ylC5ZcoP_g; path=/; secure; HttpOnly; SameSite=Lax
// Request duration: 0.003044s
```

The relevant configuration is in `app-book-collection/config/dispatcher.ex`. Our service will respond to `GET` and `POST` of special-books, but we'll simplify the rule and forward all calls to special-books and any subpath.

```elixir
match "/special-books/*path" do
  Proxy.forward conn, path, "http://special-books/special-books/"
end
```

The dispatcher allows specific services to answer based on the accepted and preferred accept type. Requests may be specified within a specific layer which means they'll be handled in that order. This helps to handle cases such as the frontend (which should respond to anything that accepts html) and catch-all 404 routes in a comprehensible manner. Let's specify our route specifically in the `:services` layer and indicate we'll only yield `json` responses (defined as `"application/json", "application/vnd.api+json"` above).

```diff
+
+ match "/special-books/*path", %{ layer: :static, accept: %{ json: true } } do
+   Proxy.forward conn, path, "http://special-books/special-books/"
+ end
=
= match "/*_", %{ layer: :not_found } do
```

Next up we restart the dispatcher. We only have to restart the dispatcher because its configuration has changed. Most services don't pick up changes to the mounted configuration files and a restart is advised in that case. Try to restart only the service you believe has changed for a better understanding of the stack and an enchanced dev cycle.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart dispatcher
```

We can now connect to our service from localhost directly (without port):

```restclient
GET http://localhost/special-books/
```

```html
Listing books
<!-- GET http://localhost/special-books/ -->
<!-- HTTP/1.1 200 OK -->
<!-- cache-control: no-cache -->
<!-- connection: close -->
<!-- content-type: text/html; charset=utf-8 -->
<!-- date: Sat, 15 Feb 2025 15:52:37 GMT -->
<!-- expires: -1 -->
<!-- pragma: no-cache -->
<!-- server: Werkzeug/2.1.2 Python/3.8.12 -->
<!-- transfer-encoding: chunked -->
<!-- vary: accept, cookie, accept-encoding -->
<!-- set-cookie: proxy_session=QTEyOEdDTQ.HL3SctCHUtZh4icvJ4A8sECfc6K88Ypb951DlJyEqKkhfQbO-fVO7dZW1eQ.ZZrLjKsExvESVm3z.9l-EbA0E1SobCRSHnr0bcflNPrwWIIFv2SodWo699x5uLpAm7HshMpHOKdfTNR223qkOJ3O7Z-nADEUI3JgAGLiyEgGMkhyCOzdLvHRSotEsdMvddJ9c0S4OGAzm.m6SJUqKBM43m_0lkLcN3kQ; path=/; secure; HttpOnly; SameSite=Lax -->
<!-- Request duration: 1.333360s -->
```

```restclient
POST http://localhost/special-books/
```

```html
Creating book
<!-- POST http://localhost/special-books/ -->
<!-- HTTP/1.1 200 OK -->
<!-- cache-control: no-cache -->
<!-- connection: close -->
<!-- content-type: text/html; charset=utf-8 -->
<!-- date: Sat, 15 Feb 2025 15:52:30 GMT -->
<!-- expires: -1 -->
<!-- pragma: no-cache -->
<!-- server: Werkzeug/2.1.2 Python/3.8.12 -->
<!-- transfer-encoding: chunked -->
<!-- vary: accept, cookie, accept-encoding -->
<!-- set-cookie: proxy_session=QTEyOEdDTQ.9LcmbFa94Tx7XjLyWjitA26FDNS4BbjlrEA_SPV2YmlA3mCMPRDHOupnG8U.Zo7UJ98DYCGgKuRZ.XXW8lA1bLxgM21dETV6xk35MQKuzpuoF0Dl0QBvhBSInc72vKaTvOfaC7yEdplLR2zCBPO9i1mjBQJrUnAnZEy4TSWb2dtHeg4Y3Q0k2M_OcqJjeoS-B7QbxVKOt.qQBXMVUaMQG5eDAEkSfKBA; path=/; secure; HttpOnly; SameSite=Lax -->
<!-- Request duration: 0.144168s -->
```


<a id="orgc1a4b42"></a>

## Implement book creation

The creation of a book can be executed by a simple create call. We'll assume the payload has the correct json-api compliant structure but will not validate it.

```python
from flask import jsonify, request
from helpers import generate_uuid, update
from escape_helpers import sparql_escape_uri, sparql_escape_string
from string import Template

@app.route('/special-books/', methods=["POST"])
def createBook():
    json_data = request.get_json()
    resource_uuid = generate_uuid()
    resource_uri = f"http://example.com/special-books/{resource_uuid}"
    title = json_data["data"]["attributes"]["title"]
    update(Template("""
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      INSERT DATA {
        $resource_uri
          a ext:SpecialBook;
          mu:uuid $resource_uuid;
          ext:title $title.
      }
    """).substitute(
        resource_uri=sparql_escape_uri(resource_uri),
        resource_uuid=sparql_escape_string(resource_uuid),
        title=sparql_escape_string(title)
    ))

    return jsonify({
        "data": {
            "type": "special-books",
            "id": resource_uuid,
            "attributes": {
                "title": title
            }
        }
    })
```

With this implementation we are ready to create our first specialBook.

We will also need some extra imports so the total diff will look like:

```diff
= # see https://github.com/mu-semtech/mu-python-template for more info
+ from flask import jsonify, request
+ from helpers import generate_uuid, update
+ from escape_helpers import sparql_escape_uri, sparql_escape_string
+ from string import Template
=
...
= @app.route('/special-books/', methods=["POST"])
= def createBook():
-     return "Creating book"
+     json_data = request.get_json()
+     resource_uuid = generate_uuid()
+     resource_uri = f"http://example.com/special-books/{resource_uuid}"
+     title = json_data["data"]["attributes"]["title"]
+     update(Template("""
+       PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
+       PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
+       INSERT DATA {
+         $resourceUri
+           a ext:SpecialBook;
+           mu:uuid $resourceUuid;
+           ext:title $title.
+       }
+     """).substitute(
+         resourceUri=sparql_escape_uri(resource_uri),
+         resourceUuid=sparql_escape_string(resource_uuid),
+         title=sparql_escape_string(title)
+     ))
+     
+     return jsonify({
+         "data": {
+             "type": "special-books",
+             "id": resource_uuid,
+             "attributes": {
+                 "title": title
+             }
+         }
+     })
```

With this in place we can send some test calls.

```restclient
POST http://localhost/special-books/
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "special-books",
    "attributes": {
      "title": "Semantic Works getting started guide"
    }
  }
}
```

```js
{
  "data": {
    "attributes": {
      "title": "Semantic Works getting started guide"
    },
    "id": "5a117bda-ebe8-11ef-9df8-0242ac160009",
    "type": "special-books"
  }
}

// POST http://localhost/special-books/
// HTTP/1.1 200 OK
// cache-control: no-cache
// connection: close
// content-type: application/json
// date: Sat, 15 Feb 2025 22:01:04 GMT
// expires: -1
// pragma: no-cache
// server: Werkzeug/2.1.2 Python/3.8.12
// transfer-encoding: chunked
// vary: accept, cookie, accept-encoding
// set-cookie: proxy_session=QTEyOEdDTQ.7RKfrMoBgd6iv6I24Uhu6x1_jU1b1BrXJCbIavW9bQJC3PS3QaaEqD08FCk.H7qmZHEoK4gFpYEy.J6xZYzYWNarMRY7Qg6mINXMeCu7AJvnF_mLFS3nbv1gaeU7w1xH_tx_WCwr0CGCBR7_AejuRA0_vFu3vFdWXZKoVKiMxPtVKae4HM9IYK7de42h3G12yUoh7EyPA.Agiy-btqmse1xDalRfGnKg; path=/; secure; HttpOnly; SameSite=Lax
// Request duration: 0.276999s
// set-cookie: proxy_session=QTEyOEdDTQ.7RKfrMoBgd6iv6I24Uhu6x1_jU1b1BrXJCbIavW9bQJC3PS3QaaEqD08FCk.H7qmZHEoK4gFpYEy.J6xZYzYWNarMRY7Qg6mINXMeCu7AJvnF_mLFS3nbv1gaeU7w1xH_tx_WCwr0CGCBR7_AejuRA0_vFu3vFdWXZKoVKiMxPtVKae4HM9IYK7de42h3G12yUoh7EyPA.Agiy-btqmse1xDalRfGnKg; path=/; secure; HttpOnly; SameSite=Lax
// Request duration: 0.276999s
```

Our backend seems happy with the request. Let's see what's stored in the public graph (see `app-book-collection/config/authorization/config.lisp` for the graph we'll write to).

```sparql
SELECT *
WHERE {
  GRAPH <http://mu.semte.ch/graphs/public> {
    ?s ?p ?o.
  }
}
```

| s                                                                       | p                                                 | o                                                 |
|----------------------------------------------------------------------- |------------------------------------------------- |------------------------------------------------- |
| <http://example.com/special-books/5a117bda-ebe8-11ef-9df8-0242ac160009> | <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> | <http://mu.semte.ch/vocabularies/ext/SpecialBook> |
| <http://example.com/special-books/5a117bda-ebe8-11ef-9df8-0242ac160009> | <http://mu.semte.ch/vocabularies/ext/title>       | Semantic Works getting started guide              |
| <http://example.com/special-books/5a117bda-ebe8-11ef-9df8-0242ac160009> | <http://mu.semte.ch/vocabularies/core/uuid>       | 5a117bda-ebe8-11ef-9df8-0242ac160009              |

As we can see, the books are stored in the triplestore.


<a id="orgf175247"></a>

## Listing the books

The previous call created some special books. Let's return the first special books.

```python
@app.route("/special-books/", methods=["GET"])
def listBooks():
    page_size = 5
    page = int(request.args.get("page", default="0"))

    query_results = query(Template("""
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      SELECT * WHERE {
        ?s a ext:SpecialBook;
           mu:uuid ?uuid;
           ext:title ?title.
      } ORDER BY ?uuid LIMIT $page_size OFFSET $offset
    """).substitute(
        offset=page_size * page,
        page_size=page_size
    ))

    return jsonify({
        "data": [
            {
                "type": "special-books",
                "id": binding["uuid"]["value"],
                "attributes": {
                    "title": binding["title"]["value"]
                }
            }
            for binding in query_results["results"]["bindings"]
        ]
    })
```

We will also update some imports so the diff would look like:

```diff
= from flask import jsonify, request
- from helpers import generate_uuid, update
+ from helpers import generate_uuid, update, query
= from escape_helpers import sparql_escape_uri, sparql_escape_string
...
= @app.route("/special-books/", methods=["GET"])
= def listBooks():
-    return "Listing books"
+    page_size = 5
+    page = int(request.args.get('page', default="0"))
+
+    query_results = query(Template("""
+      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
+      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
+      SELECT * WHERE {
+        ?s a ext:SpecialBook;
+           mu:uuid ?uuid;
+           ext:title ?title.
+      } ORDER BY ?uuid LIMIT $page_size OFFSET $offset
+    """).substitute(
+        offset=page_size * page,
+        page_size=page_size
+    ))
+
+    return jsonify({
+        "data": [
+            {
+                "type": "special-books",
+                "id": binding["uuid"]["value"],
+                "attributes": {
+                    "title": binding["title"]["value"]
+                }
+            }
+            for binding in query_results["results"]["bindings"]
+        ]
+    })
```

That's all there is to request the book listing.

```restclient
GET http://localhost/special-books/
Accept: application/vnd.api+json
```

```javascript
{
  "data": [
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "1ab7cc36-ebe9-11ef-b59b-0242ac160009",
      "type": "special-books"
    },
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "473b4f4e-ebe9-11ef-ae04-0242ac160009",
      "type": "special-books"
    },
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "5a117bda-ebe8-11ef-9df8-0242ac160009",
      "type": "special-books"
    },
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "77c99db4-ebe9-11ef-b4c9-0242ac160009",
      "type": "special-books"
    },
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "a28ac2c6-ebe9-11ef-84ce-0242ac160009",
      "type": "special-books"
    }
  ]
}

// GET http://localhost/special-books/
// HTTP/1.1 200 OK
// cache-control: no-cache
// connection: close
// content-type: application/json
// date: Sat, 15 Feb 2025 22:55:24 GMT
// expires: -1
// pragma: no-cache
// server: Werkzeug/2.1.2 Python/3.8.12
// transfer-encoding: chunked
// vary: accept, cookie, accept-encoding
// set-cookie: proxy_session=QTEyOEdDTQ.3V8TC-LrHzZeu3gQCXWqXQzzMwf3MwnBi082IIaT2J-eNkMpHtv0X-u-kDM.21HmYtSPqtfZrf9P.7VMrHRtCqaJtFRkVJoxsrGH0ZU_uM01Ih1ibQy4flyVA3I5EwW9tB7qZSmGKWCpTKwWUGXgTlnCQNTjET7vr3XjvYMICXShmmUBdBVjWk1lRTB5ZeVXA58QMZZsO.1bRDqD6tlO2bvd6p1DgtGw; path=/; secure; HttpOnly; SameSite=Lax
// Request duration: 0.065234s
```

```restclient
GET http://localhost/special-books/?page=1
Accept: application/vnd.api+json
```

```javascript
{
  "data": [
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "b509d130-ebe9-11ef-9ed5-0242ac160009",
      "type": "special-books"
    },
    {
      "attributes": {
        "title": "Semantic Works getting started guide"
      },
      "id": "fb3cc4d8-ebe8-11ef-916d-0242ac160009",
      "type": "special-books"
    }
  ]
}

// GET http://localhost/special-books/?page=1
// HTTP/1.1 200 OK
// cache-control: no-cache
// connection: close
// content-type: application/json
// date: Sat, 15 Feb 2025 22:55:59 GMT
// expires: -1
// pragma: no-cache
// server: Werkzeug/2.1.2 Python/3.8.12
// transfer-encoding: chunked
// vary: accept, cookie, accept-encoding
// set-cookie: proxy_session=QTEyOEdDTQ.NJO0LWBYH9w2ok_FJbF7xHiZQ8xGrq78UUIQdiuli98AR92W2GgtXiMm8wk.tqQiKB01ebAtrcZv.DTj1iZnXKw5XauFQSVfXi5CnQmNsI5GDgO8CSdUZukw9YTao3aSWj6NKlzeyqr4g8hkV4K2P05jt4qOjhEZ1fb4k9c6KASh3T8JxuYBQl8R1au2XhBOe17uPyH4U.jAB1ln0G4zo5mfKvzKzMXw; path=/; secure; HttpOnly; SameSite=Lax
// Request duration: 0.061559s
```

# Next steps

Well done! You've built your first application with semantic.works.  The most effective next steps are building a small CRUD application for a known domain and reading the README files of common core services whilst you're at it.

