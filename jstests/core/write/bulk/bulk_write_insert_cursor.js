/**
 * Tests bulk write cursor response for correct responses.
 *
 * @tags: [
 *   # The test runs commands that are not allowed with security token: bulkWrite.
 *   not_allowed_with_security_token,
 *   command_not_supported_in_serverless,
 *   # TODO SERVER-52419 Remove this tag.
 *   featureFlagBulkWriteCommand,
 * ]
 */
import {cursorEntryValidator, cursorSizeValidator} from "jstests/libs/bulk_write_utils.js";

var coll = db.getCollection("coll");
var coll1 = db.getCollection("coll1");
coll.drop();
coll1.drop();

// Make sure a properly formed request has successful result.
var res = db.adminCommand(
    {bulkWrite: 1, ops: [{insert: 0, document: {skey: "MongoDB"}}], nsInfo: [{ns: "test.coll"}]});

assert.commandWorked(res);
cursorSizeValidator(res, 1);
assert.eq(res.numErrors, 0, "bulkWrite command response: " + tojson(res));

assert(res.cursor.id == 0,
       "Unexpectedly found non-zero cursor ID in bulkWrite command response: " + tojson(res));
cursorEntryValidator(res.cursor.firstBatch[0], {ok: 1, n: 1, idx: 0});

assert.eq(coll.find().itcount(), 1);
assert.eq(coll1.find().itcount(), 0);

coll.drop();

// Test internal batch size > 1.
res = db.adminCommand({
    bulkWrite: 1,
    ops: [{insert: 0, document: {skey: "MongoDB"}}, {insert: 0, document: {skey: "MongoDB"}}],
    nsInfo: [{ns: "test.coll"}]
});

assert.commandWorked(res);
cursorSizeValidator(res, 2);
assert.eq(res.numErrors, 0, "bulkWrite command response: " + tojson(res));

assert(res.cursor.id == 0,
       "Unexpectedly found non-zero cursor ID in bulkWrite command response: " + tojson(res));
cursorEntryValidator(res.cursor.firstBatch[0], {ok: 1, n: 1, idx: 0});
cursorEntryValidator(res.cursor.firstBatch[1], {ok: 1, n: 1, idx: 1});

assert.eq(coll.find().itcount(), 2);
assert.eq(coll1.find().itcount(), 0);
coll.drop();
