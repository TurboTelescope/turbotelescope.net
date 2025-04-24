import { Rpc, RpcGroup } from "@effect/rpc";
import { DateTime, Effect, Function, Option, ParseResult, Schema } from "effect";

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

/** Schema for Image Status tables */
export class ImageStatusTableRow extends Schema.Class<ImageStatusTableRow>("ImageStatusTableRow")({
    imageId: Schema.Number,
    pipelineStep: Schema.String.pipe(Schema.brand("pipelineStep")),
    description: Schema.String,
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

export class DatabaseRpcs extends RpcGroup.make(
    Rpc.make("RunsInTimeRangeRequest", {
        error: Schema.Never,
        success: Schema.Record({ key: SchemaName.from, value: Schema.Array(ResultRow) }),
        payload: { from: Schema.DateTimeUtc, until: Schema.DateTimeUtc },
    })
) {}
