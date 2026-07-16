import { Course } from "../data/courses";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { PlayCircle, Clock, CheckCircle2, BookOpen, ArrowLeft, Headphones } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PurchasedCourse extends Course {
  progress: number;
  lastWatched?: string;
  completedLessons: number;
}

interface Podcast {
  id: string;
  title: string;
  description?: string;
  image?: string;
  videoUrl: string;
  duration?: string;
  listens: number;
}

interface MyCoursesProps {
  purchasedCourses: PurchasedCourse[];
  podcasts?: Podcast[];
  onWatchCourse: (course: PurchasedCourse) => void;
  onWatchPodcast?: (podcast: Podcast) => void;
  onBack: () => void;
}

const PAGE_BG =
  "linear-gradient(180deg, #0a0a1a 0%, #1a0f2e 15%, #0f1a2e 30%, #1a0f2e 45%, #0f1a2e 60%, #1a0f2e 75%, #0a0a1a 100%)";

export function MyCourses({
  purchasedCourses,
  podcasts = [],
  onWatchCourse,
  onWatchPodcast,
  onBack,
}: MyCoursesProps) {
  const hasContent = purchasedCourses.length > 0 || podcasts.length > 0;

  const totalProgress =
    purchasedCourses.length > 0
      ? purchasedCourses.reduce((acc, course) => acc + course.progress, 0) /
        purchasedCourses.length
      : 0;
  const completedCourses = purchasedCourses.filter((c) => c.progress === 100).length;
  const lessonsWatched = purchasedCourses.reduce((acc, c) => acc + c.completedLessons, 0);

  if (!hasContent) {
    return (
      <div className="min-h-screen" style={{ background: PAGE_BG }}>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-10 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="border border-white/[0.08] bg-white/[0.03] px-6 py-16 sm:px-10">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
              Biblioteca
            </p>
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Você ainda não tem cursos
            </h1>
            <p className="mb-8 max-w-lg text-base text-white/45">
              Explore o catálogo e comece sua jornada de transformação.
            </p>
            <Button
              size="lg"
              onClick={onBack}
              className="h-11 rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Explorar cursos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { value: purchasedCourses.length, label: "Cursos" },
    { value: podcasts.length, label: "Podcasts" },
    { value: completedCourses, label: "Concluídos" },
    { value: `${Math.round(totalProgress)}%`, label: "Progresso" },
    { value: lessonsWatched, label: "Aulas assistidas" },
  ];

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-8 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <header className="mb-12 border-b border-white/[0.07] pb-10 lg:mb-14 lg:pb-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300/60">
                Biblioteca
              </p>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Meus cursos
              </h1>
              <p className="max-w-xl text-base text-white/45">
                Continue sua jornada de aprendizado e transformação.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-5 sm:px-5"
              >
                <p className="text-3xl font-light tracking-tight text-white tabular-nums sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </header>

        {purchasedCourses.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="mb-1 text-2xl font-semibold tracking-tight text-white">
                Continue aprendendo
              </h2>
              <p className="text-sm text-white/40">Retome de onde parou</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {purchasedCourses.map((course) => (
                <article
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/15"
                >
                  <div className="relative h-44 w-full shrink-0">
                    <ImageWithFallback
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: course.imagePosition || "50% 50%" }}
                    />
                    {course.progress === 100 && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[11px] font-medium text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Concluído
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-violet-300/70">
                      {course.category}
                    </p>
                    <h3 className="mb-2 text-lg font-medium tracking-tight text-white line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="mb-4 text-sm text-white/40 line-clamp-2">{course.description}</p>

                    <div className="mb-3 flex flex-wrap gap-3 text-xs text-white/35">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.completedLessons}/{course.lessons} aulas
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {course.duration}
                      </span>
                    </div>

                    <div className="mb-5">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-white/40">Progresso</span>
                        <span className="font-medium text-violet-300">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                    </div>

                    <Button
                      onClick={() => onWatchCourse(course)}
                      className="mt-auto h-11 w-full rounded-lg bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {course.progress === 0 ? "Começar curso" : "Continuar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {podcasts.length > 0 && (
          <section>
            <div className="mb-8">
              <h2 className="mb-1 text-2xl font-semibold tracking-tight text-white">
                Meus podcasts
              </h2>
              <p className="text-sm text-white/40">Assista seus podcasts gratuitos</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {podcasts.map((podcast) => (
                <article
                  key={podcast.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:border-white/15"
                >
                  <div className="relative h-44 w-full shrink-0">
                    {podcast.image ? (
                      <img
                        src={podcast.image}
                        alt={podcast.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-700 to-blue-800">
                        <Headphones className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-lg font-medium tracking-tight text-white line-clamp-2">
                      {podcast.title}
                    </h3>
                    {podcast.description && (
                      <p className="mb-4 text-sm text-white/40 line-clamp-2">
                        {podcast.description}
                      </p>
                    )}
                    {podcast.duration && (
                      <p className="mb-5 inline-flex items-center gap-1.5 text-xs text-white/35">
                        <Clock className="h-3.5 w-3.5" />
                        {podcast.duration}
                      </p>
                    )}
                    <Button
                      onClick={() => onWatchPodcast?.(podcast)}
                      className="mt-auto h-11 w-full rounded-lg bg-violet-600 text-sm font-semibold text-white hover:bg-violet-500"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Assistir podcast
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
