import { Rpc } from "@effect/rpc";
import { DateTime, Effect, Function, Match, Option, ParseResult, Schema } from "effect";

/** @internal */
export type Tail<T extends ReadonlyArray<unknown>> = T extends
    | [infer _First, ...infer Rest]
    | readonly [infer _First, ...infer Rest]
    ? Rest
    : Array<unknown>;

/** @internal */
export type Split<StrInput extends string, Delimiter extends string> = string extends StrInput | ""
    ? Array<string>
    : StrInput extends `${infer Head}${Delimiter}${infer Rest}`
      ? [Head, ...Split<Rest, Delimiter>]
      : [StrInput];

/** @internal */
export const tail = <T extends ReadonlyArray<unknown>>(elements: T): Tail<T> => elements.slice(1) as Tail<T>;

/** @internal */
export const splitLiteral = <StrInput extends string, Delimiter extends string>(
    strInput: StrInput,
    delimiter: Delimiter
): Split<StrInput, Delimiter> => strInput.split(delimiter) as Split<StrInput, Delimiter>;

/** Schema name for a data entry. */
export class SchemaName extends Schema.transformOrFail(
    Schema.TemplateLiteral(
        Schema.Literal("science_turbo_production_pipeline_", "reference_turbo_production_pipeline_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.Number
    ),
    Schema.DateTimeUtcFromSelf,
    {
        encode: (utcDateTime: DateTime.Utc) =>
            Effect.gen(function* () {
                const zone = yield* Effect.mapError(
                    DateTime.zoneFromString("America/chicago"),
                    () => new ParseResult.Unexpected("America/chicago", "unexpected time zone")
                );
                const localDateTime = yield* Effect.mapError(
                    DateTime.makeZoned(utcDateTime, { timeZone: zone, adjustForTimeZone: false }),
                    () => new ParseResult.Unexpected({}, "unexpected utc date time")
                );

                const pad = (n: number, digits: number = 1): `${number}` =>
                    n < 10 ** digits ? (`${"0".repeat(digits)}${n}` as `${number}`) : (`${n}` as `${number}`);

                const day = pad(DateTime.getPart(localDateTime, "day"));
                const month = pad(DateTime.getPart(localDateTime, "month"));
                const year = pad(DateTime.getPart(localDateTime, "year"), 3);
                const hours = pad(DateTime.getPart(localDateTime, "hours"));
                const minutes = pad(DateTime.getPart(localDateTime, "minutes"));
                const seconds = pad(DateTime.getPart(localDateTime, "seconds"));
                const prefix = "science_turbo_production_pipeline" as const;
                const out = `${prefix}_${month}_${day}_${year}_${hours}_${minutes}_${seconds}` as const;
                return out;
            }),
        decode: (
            str: `${"science" | "reference"}_turbo_production_pipeline_${number}_${number}_${number}_${number}_${number}_${number}`
        ): Effect.Effect<DateTime.Utc, ParseResult.ParseIssue, never> =>
            Effect.gen(function* () {
                const splitAndDropFirst4 = Function.flow(splitLiteral, tail, tail, tail, tail);
                const [monthString, dayString, yearString, hoursString, minutesString, secondsString] =
                    splitAndDropFirst4(str, "_");

                const numberToIntRangedSchema = (min: number, max: number) =>
                    Function.pipe(Schema.NumberFromString, Schema.compose(Schema.Int), Schema.between(min, max));

                const decodeToRange = (min: number, max: number) =>
                    Function.flow(
                        Schema.decode(numberToIntRangedSchema(min, max)),
                        Effect.mapError((parseError) => parseError.issue)
                    );

                const year = yield* decodeToRange(0, 9999)(yearString);
                const month = yield* decodeToRange(1, 12)(monthString);
                const day = yield* decodeToRange(1, 31)(dayString);
                const hours = yield* decodeToRange(0, 23)(hoursString);
                const minutes = yield* decodeToRange(0, 59)(minutesString);
                const seconds = yield* decodeToRange(0, 59)(secondsString);

                const zone = yield* Effect.mapError(
                    DateTime.zoneFromString("America/chicago"),
                    () => new ParseResult.Unexpected("America/chicago", "unexpected time zone")
                );

                const maybeDateTime = Function.pipe(
                    DateTime.makeZoned(
                        { year, month, day, hours, minutes, seconds },
                        {
                            timeZone: zone,
                            adjustForTimeZone: true,
                        }
                    ),
                    Option.map(DateTime.toPartsUtc),
                    Option.flatMap(DateTime.make)
                );

                if (Option.isSome(maybeDateTime)) {
                    return maybeDateTime.value;
                } else {
                    return yield* ParseResult.fail(
                        new ParseResult.Unexpected(
                            { year, month, day, hours, minutes, seconds },
                            "unexpected date time parameters"
                        )
                    );
                }
            }),
    }
) {}

/** Pipeline step names for lightweight runtime */
export class PipelineStepName extends Schema.Literal(
    "Bad pix map generation",
    "Basic data reduction",
    "Subtract Background and generate source cat",
    "filter image by the shape of sources",
    "Assign Reference from file",
    "Assign Reference",
    "Align ref to sci and propagate wcs from ref to sci",
    "Run Sfft Subtraction",
    "Extract sources from difference image",
    "Filter out candidates close to stars",
    "Calculate zeropoint of image",
    "Calculate real-bogus score for candidates",
    "Making cutouts ",
    "save the image",

    // NEW!!!!
    "Perform basic data reduction",
    "Assign reference image",
    "Filter image by the shape of sources",
    "Subtract background and generate source catalog",
    "Add image to reference stack",
    "Generate bad pixel map",

    // TODO: Find where to insert these in the order:
    "Finding the five sigma upper limit of magnitude",
    "Post annotations from MPC query",

    // "Retired" steps
    "skyportal_logging",
    "Align ref to sci and propogate wcs from ref to sci",
    "Create bad pixel mask from raw image"
) {}

/** Short pipeline step names for lightweight runtime */

export class ShortPipelineName extends Schema.transform(
    PipelineStepName,
    Schema.Literal(
        "Bad Pix Map",
        "Data Reduction",
        "Subtract",
        "Fltr Shape",
        "Assign Ref",
        "Align Ref",
        "Run Sfft",
        "Extract Sources",
        "Fltr Near Stars",
        "Zero Point",
        "Real-Bogus",
        "Cutouts",
        "Save",
        "Skyportal",

        // TODO: Find where to insert these in the order:
        "Five Sigma",
        "MPC Query"
    ),
    {
        encode: (shortName) =>
            Function.pipe(
                Match.value<typeof shortName>(shortName),
                Match.when("Bad Pix Map", () => "Bad pix map generation" as const),
                Match.when("Data Reduction", () => "Basic data reduction" as const),
                Match.when("Subtract", () => "Subtract Background and generate source cat" as const),
                Match.when("Fltr Shape", () => "filter image by the shape of sources" as const),
                Match.when("Assign Ref", () => "Assign Reference from file" as const),
                Match.when("Align Ref", () => "Align ref to sci and propagate wcs from ref to sci" as const),
                Match.when("Run Sfft", () => "Run Sfft Subtraction" as const),
                Match.when("Extract Sources", () => "Extract sources from difference image" as const),
                Match.when("Fltr Near Stars", () => "Filter out candidates close to stars" as const),
                Match.when("Zero Point", () => "Calculate zeropoint of image" as const),
                Match.when("Real-Bogus", () => "Calculate real-bogus score for candidates" as const),
                Match.when("Cutouts", () => "Making cutouts " as const),
                Match.when("Save", () => "save the image" as const),
                Match.when("Skyportal", () => "skyportal_logging" as const),
                Match.when("Five Sigma", () => "Finding the five sigma upper limit of magnitude" as const),
                Match.when("MPC Query", () => "Post annotations from MPC query" as const),
                Match.exhaustive
            ),
        decode: (longName) =>
            Function.pipe(
                Match.value<typeof longName>(longName),
                Match.when("Bad pix map generation", () => "Bad Pix Map" as const),
                Match.when("Basic data reduction", () => "Data Reduction" as const),
                Match.when("Subtract Background and generate source cat", () => "Subtract" as const),
                Match.when("filter image by the shape of sources", () => "Fltr Shape" as const),
                Match.whenOr("Assign Reference from file", "Assign Reference", () => "Assign Ref" as const),
                Match.whenOr(
                    "Align ref to sci and propagate wcs from ref to sci",
                    "Align ref to sci and propogate wcs from ref to sci",
                    () => "Align Ref" as const
                ),
                Match.when("Run Sfft Subtraction", () => "Run Sfft" as const),
                Match.when("Extract sources from difference image", () => "Extract Sources" as const),
                Match.when("Filter out candidates close to stars", () => "Fltr Near Stars" as const), // Fixed
                Match.when("Calculate zeropoint of image", () => "Zero Point" as const),
                Match.when("Calculate real-bogus score for candidates", () => "Real-Bogus" as const),
                Match.when("Making cutouts ", () => "Cutouts" as const),
                Match.when("save the image", () => "Save" as const),
                Match.when("skyportal_logging", () => "Skyportal" as const),
                Match.when("Create bad pixel mask from raw image", () => "Bad Pix Map" as const),
                Match.when("Finding the five sigma upper limit of magnitude", () => "Five Sigma" as const),
                Match.when("Post annotations from MPC query", () => "MPC Query" as const),
                Match.orElse(() => "MPC Query" as const)
            ),
    }
) {}

/** Schema for Image Status tables */
export class ImageStatusTableRow extends Schema.Class<ImageStatusTableRow>("ImageStatusTableRow")({
    imageId: Schema.Number,
    pipelineStep: PipelineStepName,
    processingTime: Schema.Number,
    completion: Schema.String,
}) {}

/** Schema for Images Table rows tables */
export class ImagesTableRow extends Schema.Class<ImagesTableRow>("ImagesTableRow")({
    imageId: Schema.Number,
    filePath: Schema.TemplateLiteral(
        Schema.String,
        Schema.Literal("telescope_"),
        Schema.Literal("r", "g"),
        Schema.Literal("_"),
        Schema.String,
        Schema.Literal("_"),
        Schema.String,
        Schema.Literal("_"),
        Schema.Number,
        Schema.Literal("_"),
        Schema.String,
        Schema.Literal(".fits")
    ),
    // object_id: Schema.String,
    // ra: Schema.NullOr(Schema.Number),
    // dec: Schema.NullOr(Schema.Number),
    // quality: Schema.NullOr(Schema.String),
    // ncoadds: Schema.NullOr(Schema.Number),
    // referencePath: Schema.NullOr(Schema.String),
    // referenceDistance: Schema.NullOr(Schema.Number),
}) {}

export class ResultRow extends Schema.Class<ResultRow>("ResultRow")({
    ...ImagesTableRow.fields,
    ...ImageStatusTableRow.fields,
    sourceTable: SchemaName.from,
}) {
    public get success(): boolean {
        return this.pipelineStep === "save the image";
    }

    public get date(): DateTime.Utc {
        return Schema.decodeSync(SchemaName)(this.sourceTable);
    }
}

export class RunsInTimeRangeRequest extends Schema.TaggedRequest<RunsInTimeRangeRequest>()("RunsInTimeRangeRequest", {
    failure: Schema.Never,
    success: Schema.Record({ key: SchemaName.from, value: Schema.Array(ResultRow) }),
    payload: { from: Schema.DateTimeUtc, until: Schema.DateTimeUtc },
}) {}

export class SubscribeToRunsRequest extends Rpc.StreamRequest<SubscribeToRunsRequest>()("SubscribeToRunsRequest", {
    failure: Schema.Never,
    success: Schema.Record({ key: SchemaName.from, value: Schema.Array(ResultRow) }),
    payload: { from: Schema.DateTimeUtc, refreshInterval: Schema.DurationFromSelf },
}) {}

export class VerboseLogRequest extends Rpc.StreamRequest<VerboseLogRequest>()("VerboseLogRequest", {
    failure: Schema.Never,
    success: Schema.Uint8Array,
    payload: { schemaName: SchemaName.from, machine: Schema.Literal("tlenaii", "popcorn") },
}) {}

export class VerboseLogURLRequest extends Schema.TaggedRequest<VerboseLogURLRequest>()("VerboseLogURLRequest", {
    failure: Schema.Never,
    success: Schema.String,
    payload: { schemaName: SchemaName.from, machine: Schema.Literal("tlenaii", "popcorn") },
}) {}
