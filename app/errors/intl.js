export default {
    DENY: 'У вас нет прав на это действие',

    BAD_PARAMS: 'Неверные параметры запроса',
    BAD_BROWSER: 'Bad browser, we do not support it',

    SESSION_CAN_REGET_REGISTERED_ONLY: 'Ошибка выборки пользователей',
    SESSION_EXPIRED_ARCHIVE_NO_RESULT: 'Ошибка архивации сессий',
    SESSION_NO_HEADERS: 'Bad request - no header or user agent',
    SESSION_NOT_FOUND: 'Сессия не найдена',

    TIMEOUT: 'Превышено время ожидания',
    UNHANDLED_ERROR: 'На сервере возникла ошибка',
    COUNTER_ERROR: 'На сервере возникла ошибка',

    NOTICE: 'Уведомление',

    NOT_FOUND: 'Ресурс не найден',
    NOT_FOUND_USER: 'Пользователь не найден',
    NO_SUCH_METHOD: 'Запрашиваемый метод не сушествует',
    NO_SUCH_RESOURCE: 'Ресурс не найден',
    NO_SUCH_PHOTO: 'Запрашиваемой фотографии не существует или она не доступна',
    NO_SUCH_USER: 'Запрашиваемый пользователь не существует',
    NO_SUCH_REGION: 'Такого региона не существует',
    NO_SUCH_NEWS: 'Такой новости не существует',

    INPUT: 'Ошибка ввода',
    INPUT_FIELD_REQUIRED: 'Обязтельное поле ввода',
    INPUT_LOGIN_REQUIRED: 'Заполните имя пользователя',
    INPUT_LOGIN_CONSTRAINT: 'Имя пользователя должно содержать от 3 до 15 латинских символов и начинаться с буквы. ' +
    'В состав слова могут входить цифры, точка, подчеркивание и тире',
    INPUT_PASS_REQUIRED: 'Введите пароль',
    INPUT_EMAIL_REQUIRED: 'Введите адрес email',

    AUTHENTICATION: 'Ошибка аутентификации',
    AUTHENTICATION_REGISTRATION: 'Ошибка аутентификации',
    AUTHENTICATION_PASSCHANGE: 'Ошибка смены пароля',
    AUTHENTICATION_DOESNT_MATCH: 'Неправильная пара логин-пароль',
    AUTHENTICATION_MAX_ATTEMPTS: 'Ваш аккаунт временно заблокирован из-за превышения количества попыток ввода неверных данных',
    AUTHENTICATION_PASS_WRONG: 'Пароль не верен',
    AUTHENTICATION_CURRPASS_WRONG: 'Текущий пароль не верен',
    AUTHENTICATION_PASSWORDS_DONT_MATCH: 'Пароли не совпадают',
    AUTHENTICATION_USER_EXISTS: 'Пользователь с таким именем уже зарегистрирован',
    AUTHENTICATION_USER_DOESNT_EXISTS: 'Пользователя с таким логином или e-mail не существует',
    AUTHENTICATION_EMAIL_EXISTS: 'Пользователь с таким email уже зарегистрирован',
    AUTHENTICATION_KEY_DOESNT_EXISTS: 'Переданного вами ключа не существует',

    PHOTO_CHANGED: 'С момента обновления вами страницы, информация на ней была кем-то изменена',
    PHOTO_NEED_REASON: 'Необходимо указать причину операции',
    PHOTO_NEED_COORD: 'Фотография должна иметь координату или быть привязана к региону вручную',
    PHOTO_NEED_TITLE: 'Необходимо заполнить название фотографии',
    PHOTO_ANOTHER_STATUS: 'Фотография уже в другом статусе, обновите страницу',
    PHOTO_YEARS_CONSTRAINT: 'Опубликованные фотографии должны иметь предполагаемую датировку в интервале 1826—2000гг.',
    PHOTO_CONVERT_PROCEEDING: 'Вы уже отправили запрос и он еще выполняется. Попробуйте позже',

    COMMENT_NO_OBJECT: 'Комментируемого объекта не существует, или он находится в недоступном вам режиме',
    COMMENT_NOT_ALLOWED: 'Операции с комментариями на этой странице запрещены',
    COMMENT_DOESNT_EXISTS: 'Комментария не существует',
    COMMENT_WRONG_PARENT: 'Что-то не так с родительским комментарием. Возможно он был удален. Пожалуйста, обновите страницу',
    COMMENT_TOO_LONG: 'Комментарий длиннее допустимого значения (12000)',

    ADMIN_CANT_CHANGE_HIS_ROLE: 'Администратор не может менять свою роль :)',
    ADMIN_SUPER_CANT_BE_ASSIGNED: 'Суперадминистратор не может быть назначен через интерфейс управления пользователями',
    ADMIN_ONLY_SUPER_CAN_ASSIGN: 'Только суперадминистратор может назначать администраторов',

    CONVERT_PHOTOS_ALL: 'Ошибка отправки на конвертацию',
    CONVERT_PROMISE_GENERATOR: 'Ошибка выполнения операции в конвейере конвертации',

    HISTORY_DOESNT_EXISTS: 'Для объекта еще нет истории',

    MAIL_SEND: 'Ошибка отправки письма'
};