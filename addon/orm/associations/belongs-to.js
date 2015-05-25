import { singularize, capitalize } from 'ember-cli-mirage/utils/inflector';
import Association from './association';

export default Association.extend({

  getForeignKeysHash: function(key, initAttrs) {
    var foreignKey = key + '_id';
    var hash = {};
    hash[foreignKey] = initAttrs[foreignKey] !== undefined ? initAttrs[foreignKey] : null;

    // Set foreign key if model was passed in
    if (initAttrs[key] && initAttrs[key].id) {
      hash[foreignKey] = initAttrs[key].id;
    }

    return hash;
  },

  defineRelationship: function(model, key, schema, initAttrs) {
    var _this = this;
    var foreignKey = key + '_id';

    Object.defineProperty(model, foreignKey, {
      /*
        object.parent_id
          - added by belongsTo
          - returns the associated parent's id
      */
      get: function() {
        return this.attrs[foreignKey];
      },

      /*
        object.parent_id = (parentId)
          - added by belongsTo
          - sets the associated parent (via id)
      */
      set: function(val) {
        _this._tempParent = null;
        this.attrs[foreignKey] = val;
        return this;
      }
    });

    Object.defineProperty(model, key, {
      /*
        object.parent
          - added by belongsTo
          - returns the associated parent
      */
      get: function() {
        if (_this._tempParent) {
          return _this._tempParent;
        }

        var relatedType = _this.type ? _this.type : singularize(key);
        return schema[relatedType].find(model[foreignKey]);
      },

      /*
        object.parent = (parentModel)
          - added by belongsTo
          - sets the associated parent (via model)
      */
      set: function(newModel) {
        if (newModel && newModel.isNew()) {
          model[foreignKey] = null;
          _this._tempParent = newModel;
        } else if (newModel) {
          _this._tempParent = null;
          model[foreignKey] = newModel.id;
        } else {
          model[foreignKey] = null;
        }
      }
    });

    // If an unsaved model was passed into init, save a reference to it
    if (initAttrs[key] && !initAttrs[key].id) {
      this._tempParent = initAttrs[key];
    }

    /*
      object.newParent
        - added by belongsTo
        - creates a new unsaved associated parent
    */
    model['new' + capitalize(key)] = function(attrs) {
      var newModel = schema[key].new(attrs);
      model[key] = newModel;

      return newModel;
    };

    /*
      object.createParent
        - added by belongsTo
        - creates an associated parent, persists directly to db
    */
    model['create' + capitalize(key)] = function(attrs) {
      var newModel = schema[key].create(attrs);
      model[foreignKey] = newModel.id;

      return newModel;
    };
  }

});
