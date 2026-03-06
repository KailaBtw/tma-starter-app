# Helper functions to populate the database from CSVs

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models import (
    CompletedUserItem,
    Course,
    CourseModule,
    CourseUser,
    Module,
    ModulePost,
    Post,
    PostContent,
    PostType,
    User,
)


# Create module from CSV
async def create_module(
    db: AsyncSession,
    title: str,
    description: str | None = None,
    color: str | None = None,
    ordering: int = 0,
) -> Module:
    module = Module(
        title=title,
        description=description,
        color=color,
        ordering=ordering,
    )
    db.add(module)
    await db.flush()

    return module


async def create_module_from_csv(db: AsyncSession, module_data: dict) -> Module:
    ordering = module_data.get("ordering")
    if ordering is not None:
        ordering = int(ordering)
    else:
        ordering = 0
    return await create_module(
        db,
        module_data["title"],
        module_data.get("description"),
        module_data.get("color"),
        ordering,
    )


def _parse_post_type(value: str | None) -> PostType:
    """Map CSV string to PostType enum; default to generic."""
    if not value:
        return PostType.generic
    v = str(value).strip().lower()
    try:
        return PostType(v)
    except ValueError:
        return PostType.generic


# Create post from CSV
async def create_post(
    db: AsyncSession,
    title: str,
    description: str | None = None,
    content: str | None = None,
    post_type: PostType | None = None,
) -> Post:
    if post_type is None:
        post_type = PostType.generic
    post = Post(
        title=title,
        description=description,
        content=content,
        post_type=post_type,
    )
    db.add(post)
    await db.flush()

    return post


async def create_post_from_csv(db: AsyncSession, post_data: dict) -> Post:
    return await create_post(
        db,
        post_data["title"],
        post_data.get("description"),
        post_data.get("content"),
        _parse_post_type(post_data.get("post_type")),
    )


# Create post content from CSV
async def create_post_content(
    db: AsyncSession,
    post: Post,
    ordering: int,
    content: str | None = None,
    content_type: str | None = None,
) -> PostContent:
    post_content = PostContent(
        post_id=post.id,
        ordering=ordering,
        content=content,
        content_type=content_type,
    )
    db.add(post_content)
    await db.flush()

    return post_content


async def create_post_content_from_csv(
    db: AsyncSession, post_content_data: dict
) -> PostContent | None:
    result = await db.execute(
        select(Post).where(Post.title == post_content_data["post_title"])
    )
    post = result.scalar_one_or_none()
    if post is None:
        return None

    ordering = post_content_data.get("ordering")
    if ordering is not None:
        ordering = int(ordering)
    else:
        ordering = 0

    return await create_post_content(
        db,
        post,
        ordering,
        post_content_data.get("content"),
        post_content_data.get("content_type"),
    )


# Add user to course
async def add_user_to_course(
    db: AsyncSession,
    course: Course,
    user: User,
) -> CourseUser:
    course_user = CourseUser(course_id=course.id, user_id=user.id)
    db.add(course_user)
    await db.flush()

    return course_user


# Add module to course
async def add_module_to_course(
    db: AsyncSession,
    course: Course,
    module: Module,
    ordering: int,
) -> CourseModule:
    course_module = CourseModule(
        course_id=course.id, module_id=module.id, ordering=ordering
    )
    db.add(course_module)
    await db.flush()

    return course_module


# Add post to module
async def add_post_to_module(
    db: AsyncSession,
    module: Module,
    post: Post,
    ordering: int,
) -> ModulePost:
    module_post = ModulePost(module_id=module.id, post_id=post.id, ordering=ordering)
    db.add(module_post)
    await db.flush()

    return module_post


# Mark course / module / post as completed for user
async def mark_item_as_completed_for_user(
    db: AsyncSession,
    user: User,
    course: Course,
    module: Module,
    post: Post,
) -> CompletedUserItem:
    completed_user_item = None

    if course is not None:
        completed_user_item = CompletedUserItem(user_id=user.id, course_id=course.id)

    elif module is not None:
        completed_user_item = CompletedUserItem(user_id=user.id, module_id=module.id)

    else:
        completed_user_item = CompletedUserItem(user_id=user.id, post_id=post.id)

    db.add(completed_user_item)
    await db.flush()

    return completed_user_item
